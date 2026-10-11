"""Central SSRF validation and DNS-pinned HTTP transports."""

from __future__ import annotations

import ipaddress
import os
import socket
from dataclasses import dataclass
from typing import Optional
from urllib.parse import urlparse

import httpcore
import httpx
from httpcore._backends.auto import AutoBackend
from httpcore._backends.sync import SyncBackend

from app.core.unified_logging import get_logger

logger = get_logger(__name__)

DEFAULT_ALLOWED_SCHEMES = ("http", "https")
DEFAULT_ALLOWED_PORTS = frozenset({80, 443})


@dataclass(frozen=True)
class SafeTarget:
    """A URL target whose DNS answers have already passed SSRF checks."""

    hostname: str
    addresses: tuple[str, ...]


def _resolve_host_ips(hostname: str) -> list[str]:
    """Resolve a hostname once and return all unique IPv4/IPv6 answers."""
    try:
        infos = socket.getaddrinfo(hostname, None, type=socket.SOCK_STREAM)
    except socket.gaierror:
        return []
    return sorted({info[4][0].split("%", 1)[0] for info in infos})


def _normalized_ip(ip_str: str) -> ipaddress.IPv4Address | ipaddress.IPv6Address:
    ip = ipaddress.ip_address(ip_str)
    if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped is not None:
        return ip.ipv4_mapped
    return ip


_BENCHMARK_FAKEIP_NET = ipaddress.ip_network("198.18.0.0/15")


def _is_private_or_reserved(ip_str: str) -> bool:
    """Reject every address that is not globally routable, including mapped IPv4."""
    try:
        ip = _normalized_ip(ip_str)
    except ValueError:
        return True
    if ip.is_global:
        return False
    # 开发机放行 fake-ip：Clash 等代理工具的 fake-ip 模式会把所有域名解析到
    # 198.18.0.0/15，实际连接由代理核心接管，无法也不应在此拦截。
    # 仅当显式设置 SSRF_ALLOW_BENCHMARK_IPS=1 时放行——只用于本地开发，
    # 生产/CI 环境绝不能开启。
    if os.getenv("SSRF_ALLOW_BENCHMARK_IPS") == "1" and ip in _BENCHMARK_FAKEIP_NET:
        return False
    return True


def _hostname_from_endpoint(value: object) -> Optional[str]:
    raw = str(value or "").strip()
    if not raw:
        return None
    parsed = urlparse(raw if "://" in raw else f"//{raw}")
    return parsed.hostname.lower().rstrip(".") if parsed.hostname else None


def _configured_blocked_hosts() -> set[str]:
    """Build a denylist from this service's own configured network endpoints."""
    blocked = {
        item.strip().lower().rstrip(".")
        for item in os.getenv("SSRF_BLOCKED_HOSTS", "").split(",")
        if item.strip()
    }

    # Import lazily to avoid a config -> guard import cycle during startup.
    try:
        from app.core.config import settings

        candidates = (
            settings.BACKEND_BASE_URL,
            settings.MINIO_ENDPOINT,
            settings.MYSQL_SERVER,
            settings.HOST,
        )
        blocked.update(
            hostname
            for hostname in (_hostname_from_endpoint(item) for item in candidates)
            if hostname and hostname not in {"0.0.0.0", "::"}
        )
    except Exception:
        logger.exception("SSRF denylist: failed to read application endpoints")

    # Directly assigned interface addresses cover non-NAT deployments.
    blocked.update(_resolve_host_ips(socket.gethostname()))
    return blocked


def _allowed_ports() -> frozenset[int]:
    configured = os.getenv("SSRF_ALLOWED_PORTS", "")
    if not configured.strip():
        return DEFAULT_ALLOWED_PORTS
    try:
        ports = frozenset(int(item.strip()) for item in configured.split(","))
    except ValueError:
        logger.error("Invalid SSRF_ALLOWED_PORTS; using safe defaults")
        return DEFAULT_ALLOWED_PORTS
    if not ports or not all(1 <= port <= 65535 for port in ports):
        return DEFAULT_ALLOWED_PORTS
    return ports


def resolve_safe_url(
    url: str, allowed_schemes: Optional[tuple[str, ...]] = None
) -> Optional[SafeTarget]:
    """Validate a URL and return the exact DNS answers that must be used to connect."""
    if not url:
        return None

    schemes = allowed_schemes or DEFAULT_ALLOWED_SCHEMES
    try:
        parsed = urlparse(url)
        hostname = (
            (parsed.hostname or "").encode("idna").decode("ascii").lower().rstrip(".")
        )
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
    except (UnicodeError, ValueError, AttributeError):
        return None

    if parsed.scheme.lower() not in schemes or not hostname:
        return None
    if parsed.username is not None or parsed.password is not None:
        return None
    if port not in _allowed_ports():
        logger.warning(f"SSRF protection: refused destination port {port}")
        return None

    blocked_hosts = _configured_blocked_hosts()
    if hostname in blocked_hosts:
        logger.warning(f"SSRF protection: refused configured/local host {hostname}")
        return None

    try:
        literal_ip = _normalized_ip(hostname)
        addresses: "tuple[str, ...]" = (str(literal_ip),)
    except ValueError:
        addresses = tuple(_resolve_host_ips(hostname))

    if not addresses:
        logger.warning(f"SSRF protection: unable to resolve {hostname}")
        return None

    for address in addresses:
        if address.lower().rstrip(".") in blocked_hosts or _is_private_or_reserved(
            address
        ):
            logger.warning(
                f"SSRF protection: refused {hostname} because it resolves to {address}"
            )
            return None

    return SafeTarget(hostname=hostname, addresses=addresses)


def is_safe_url(url: str, allowed_schemes: Optional[tuple[str, ...]] = None) -> bool:
    """Compatibility boolean check.

    Network callers should use the safe clients below."""
    return resolve_safe_url(url, allowed_schemes) is not None


class _PinnedAsyncNetworkBackend(httpcore.AsyncNetworkBackend):
    def __init__(self, target: SafeTarget) -> None:
        self._target = target
        self._backend = AutoBackend()

    async def connect_tcp(
        self, host, port, timeout=None, local_address=None, socket_options=None
    ):
        if host.lower().rstrip(".") != self._target.hostname:
            raise httpcore.ConnectError("SSRF transport refused an unvalidated host")
        last_error: Optional[Exception] = None
        for address in self._target.addresses:
            try:
                return await self._backend.connect_tcp(
                    address, port, timeout, local_address, socket_options
                )
            except (httpcore.ConnectError, httpcore.ConnectTimeout) as exc:
                last_error = exc
        raise last_error or httpcore.ConnectError("No validated address available")

    async def connect_unix_socket(self, *args, **kwargs):
        raise httpcore.UnsupportedProtocol(
            "Unix sockets are disabled for SSRF-safe requests"
        )

    async def sleep(self, seconds: float) -> None:
        await self._backend.sleep(seconds)


class _PinnedSyncNetworkBackend(httpcore.NetworkBackend):
    def __init__(self, target: SafeTarget) -> None:
        self._target = target
        self._backend = SyncBackend()

    def connect_tcp(
        self, host, port, timeout=None, local_address=None, socket_options=None
    ):
        if host.lower().rstrip(".") != self._target.hostname:
            raise httpcore.ConnectError("SSRF transport refused an unvalidated host")
        last_error: Optional[Exception] = None
        for address in self._target.addresses:
            try:
                return self._backend.connect_tcp(
                    address, port, timeout, local_address, socket_options
                )
            except (httpcore.ConnectError, httpcore.ConnectTimeout) as exc:
                last_error = exc
        raise last_error or httpcore.ConnectError("No validated address available")

    def connect_unix_socket(self, *args, **kwargs):
        raise httpcore.UnsupportedProtocol(
            "Unix sockets are disabled for SSRF-safe requests"
        )


def create_safe_async_client(url: str, **kwargs) -> httpx.AsyncClient:
    """Create an HTTP client pinned to the URL's already-validated DNS answers."""
    target = resolve_safe_url(url)
    if target is None:
        raise ValueError("Invalid or forbidden URL")
    transport = httpx.AsyncHTTPTransport(retries=0, trust_env=False)
    getattr(transport, "_pool")._network_backend = _PinnedAsyncNetworkBackend(target)
    return httpx.AsyncClient(transport=transport, trust_env=False, **kwargs)


def create_safe_sync_client(url: str, **kwargs) -> httpx.Client:
    """Synchronous equivalent of :func:`create_safe_async_client`."""
    target = resolve_safe_url(url)
    if target is None:
        raise ValueError("Invalid or forbidden URL")
    transport = httpx.HTTPTransport(retries=0, trust_env=False)
    getattr(transport, "_pool")._network_backend = _PinnedSyncNetworkBackend(target)
    return httpx.Client(transport=transport, trust_env=False, **kwargs)
