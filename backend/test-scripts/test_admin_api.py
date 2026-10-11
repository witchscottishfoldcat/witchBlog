"""
后台管理 API 测试脚本
测试后台管理功能是否正常工作
"""
import requests
import time
from typing import Optional

BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"


class AdminAPITester:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.api_base = f"{base_url}/api/v1"
        self.token: Optional[str] = None
    
    def login(self, username: str, password: str) -> bool:
        """登录获取令牌"""
        print(f"\n=== 登录: {username} ===")
        try:
            response = requests.post(
                f"{self.api_base}/auth/login",
                data={"username": username, "password": password}
            )
            response.raise_for_status()
            data = response.json()
            self.token = data.get("access_token")
            print(f"✓ 登录成功，获取令牌: {self.token[:20]}...")
            return True
        except Exception as e:
            print(f"✗ 登录失败: {e}")
            return False
    
    def _get_headers(self) -> dict:
        """获取请求头"""
        if not self.token:
            raise Exception("未登录，请先调用 login()")
        return {"Authorization": f"Bearer {self.token}"}
    
    def test_system_status(self):
        """测试系统状态接口"""
        print("\n=== 测试系统状态 ===")
        try:
            response = requests.get(
                f"{self.api_base}/admin/system-status",
                headers=self._get_headers()
            )
            response.raise_for_status()
            data = response.json()
            print(f"✓ 系统状态: {data.get('status')}")
            print(f"  - 运行时间: {data.get('uptime')} 秒")
            print(f"  - 版本: {data.get('version')}")
            print(f"  - 环境: {data.get('environment')}")
            return data
        except Exception as e:
            print(f"✗ 获取系统状态失败: {e}")
            return None
    
    def test_performance(self):
        """测试性能监控接口"""
        print("\n=== 测试性能监控 ===")
        try:
            response = requests.get(
                f"{self.api_base}/admin/performance",
                headers=self._get_headers()
            )
            response.raise_for_status()
            data = response.json()
            print(f"✓ 获取性能指标成功")
            
            system = data.get("system", {})
            print(f"  - CPU: {system.get('cpu_percent', 0)}%")
            print(f"  - 内存: {system.get('memory_percent', 0)}%")
            print(f"  - 磁盘: {system.get('disk_percent', 0)}%")
            
            app = data.get("application", {})
            print(f"  - 总请求数: {app.get('total_requests', 0)}")
            print(f"  - 平均响应时间: {app.get('average_response_time', 0)}ms")
            print(f"  - 错误率: {app.get('error_rate', 0)}%")
            
            return data
        except Exception as e:
            print(f"✗ 获取性能指标失败: {e}")
            return None
    
    def test_database_pool(self):
        """测试数据库连接池接口"""
        print("\n=== 测试数据库连接池 ===")
        try:
            response = requests.get(
                f"{self.api_base}/admin/database-pool",
                headers=self._get_headers()
            )
            response.raise_for_status()
            data = response.json()
            print(f"✓ 获取数据库连接池状态成功")
            print(f"  - 连接池大小: {data.get('pool_size', 0)}")
            print(f"  - 已取出连接: {data.get('checked_out', 0)}")
            print(f"  - 已归还连接: {data.get('checked_in', 0)}")
            print(f"  - 状态: {data.get('status', 'unknown')}")
            return data
        except Exception as e:
            print(f"✗ 获取数据库连接池状态失败: {e}")
            return None
    
    def test_log_files(self):
        """测试日志文件列表接口"""
        print("\n=== 测试日志文件列表 ===")
        try:
            response = requests.get(
                f"{self.api_base}/admin/logs/files",
                headers=self._get_headers()
            )
            response.raise_for_status()
            data = response.json()
            print(f"✓ 获取日志文件列表成功")
            print(f"  - 文件数量: {data.get('count', 0)}")
            for file in data.get('data', []):
                print(f"    * {file.get('name')} ({file.get('size')} bytes)")
            return data
        except Exception as e:
            print(f"✗ 获取日志文件列表失败: {e}")
            return None
    
    def test_log_stats(self):
        """测试日志统计接口"""
        print("\n=== 测试日志统计 ===")
        try:
            response = requests.get(
                f"{self.api_base}/admin/logs/stats",
                headers=self._get_headers()
            )
            response.raise_for_status()
            data = response.json()
            print(f"✓ 获取日志统计信息成功")
            stats = data.get('data', {})
            print(f"  - 总行数: {stats.get('total_lines', 0)}")
            print(f"  - 错误数: {stats.get('error_count', 0)}")
            print(f"  - 警告数: {stats.get('warning_count', 0)}")
            print(f"  - 信息数: {stats.get('info_count', 0)}")
            print(f"  - 文件大小: {stats.get('file_size', 0)} bytes")
            return data
        except Exception as e:
            print(f"✗ 获取日志统计信息失败: {e}")
            return None
    
    def test_dashboard(self):
        """测试仪表盘接口"""
        print("\n=== 测试仪表盘 ===")
        try:
            response = requests.get(
                f"{self.api_base}/admin/dashboard",
                headers=self._get_headers()
            )
            response.raise_for_status()
            data = response.json()
            print(f"✓ 获取仪表盘数据成功")
            print(f"  - 系统状态: {data.get('data', {}).get('system_status', {}).get('status', 'unknown')}")
            print(f"  - 时间戳: {data.get('data', {}).get('timestamp', 'unknown')}")
            return data
        except Exception as e:
            print(f"✗ 获取仪表盘数据失败: {e}")
            return None
    
    def test_health_check(self):
        """测试健康检查接口"""
        print("\n=== 测试健康检查 ===")
        try:
            response = requests.get(
                f"{self.api_base}/admin/health-check",
                headers=self._get_headers()
            )
            response.raise_for_status()
            data = response.json()
            print(f"✓ 健康检查成功")
            print(f"  - 状态: {data.get('status', 'unknown')}")
            checks = data.get('checks', {})
            for key, value in checks.items():
                status = "✓" if value else "✗"
                print(f"  - {status} {key}")
            return data
        except Exception as e:
            print(f"✗ 健康检查失败: {e}")
            return None
    
    def run_all_tests(self, username: str, password: str):
        """运行所有测试"""
        print("=" * 60)
        print("后台管理 API 测试")
        print("=" * 60)
        
        if not self.login(username, password):
            print("\n✗ 登录失败，测试终止")
            return
        
        tests = [
            ("健康检查", self.test_health_check),
            ("系统状态", self.test_system_status),
            ("性能监控", self.test_performance),
            ("数据库连接池", self.test_database_pool),
            ("日志文件列表", self.test_log_files),
            ("日志统计", self.test_log_stats),
            ("仪表盘", self.test_dashboard),
        ]
        
        passed = 0
        failed = 0
        
        for test_name, test_func in tests:
            try:
                result = test_func()
                if result:
                    passed += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"✗ {test_name}测试异常: {e}")
                failed += 1
        
        print("\n" + "=" * 60)
        print(f"测试完成: {passed} 通过, {failed} 失败")
        print("=" * 60)


def main():
    """主函数"""
    import sys
    
    if len(sys.argv) < 3:
        print("使用方法: python test_admin_api.py <username> <password>")
        print("示例: python test_admin_api.py admin password123")
        sys.exit(1)
    
    username = sys.argv[1]
    password = sys.argv[2]
    
    tester = AdminAPITester()
    tester.run_all_tests(username, password)


if __name__ == "__main__":
    main()
