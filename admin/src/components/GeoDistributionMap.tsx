import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts/core';
import { MapChart } from 'echarts/charts';
import { VisualMapComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type {
  VisitorCountryItem,
  VisitorProvinceItem,
} from '../services/siteStatsApi';

echarts.use([MapChart, VisualMapComponent, TooltipComponent, CanvasRenderer]);

export type MapViewMode = 'china' | 'world';

// 地图 GeoJSON（中国：阿里 DataV 省界含港澳台；世界：Natural Earth 110m 国家边界）
const CHINA_GEO_URL = '/geo/china-provinces.json';
const WORLD_GEO_URL = '/geo/world-countries.json';
const CHINA_MAP_NAME = 'witchcat-china';
const WORLD_MAP_NAME = 'witchcat-world';
// Natural Earth 110m 无国界字段 name（大写 NAME），世界地图数据项名取该字段
const GEO_NAME_PROPERTY = 'NAME';

// 省份短名（后端聚合口径）→ 中国 GeoJSON 行政区全名
const PROVINCE_FULL_NAME: Record<string, string> = {
  北京: '北京市',
  天津: '天津市',
  河北: '河北省',
  山西: '山西省',
  内蒙古: '内蒙古自治区',
  辽宁: '辽宁省',
  吉林: '吉林省',
  黑龙江: '黑龙江省',
  上海: '上海市',
  江苏: '江苏省',
  浙江: '浙江省',
  安徽: '安徽省',
  福建: '福建省',
  江西: '江西省',
  山东: '山东省',
  河南: '河南省',
  湖北: '湖北省',
  湖南: '湖南省',
  广东: '广东省',
  广西: '广西壮族自治区',
  海南: '海南省',
  重庆: '重庆市',
  四川: '四川省',
  贵州: '贵州省',
  云南: '云南省',
  西藏: '西藏自治区',
  陕西: '陕西省',
  甘肃: '甘肃省',
  青海: '青海省',
  宁夏: '宁夏回族自治区',
  新疆: '新疆维吾尔自治区',
  香港: '香港特别行政区',
  澳门: '澳门特别行政区',
  台湾: '台湾省',
};

// 中文国家名（qqwry 口径）→ Natural Earth NAME（新加坡等微型国家在 110m 数据中缺失，无法着色）
const COUNTRY_ENGLISH_NAME: Record<string, string> = {
  中国: 'China',
  美国: 'United States of America',
  德国: 'Germany',
  荷兰: 'Netherlands',
  英国: 'United Kingdom',
  加拿大: 'Canada',
  俄罗斯: 'Russia',
  伊朗: 'Iran',
  印度: 'India',
  奥地利: 'Austria',
  比利时: 'Belgium',
  印度尼西亚: 'Indonesia',
  保加利亚: 'Bulgaria',
  法国: 'France',
  日本: 'Japan',
  韩国: 'South Korea',
  朝鲜: 'North Korea',
  澳大利亚: 'Australia',
  新西兰: 'New Zealand',
  巴西: 'Brazil',
  墨西哥: 'Mexico',
  阿根廷: 'Argentina',
  意大利: 'Italy',
  西班牙: 'Spain',
  葡萄牙: 'Portugal',
  瑞士: 'Switzerland',
  瑞典: 'Sweden',
  挪威: 'Norway',
  芬兰: 'Finland',
  丹麦: 'Denmark',
  波兰: 'Poland',
  乌克兰: 'Ukraine',
  土耳其: 'Turkey',
  以色列: 'Israel',
  阿联酋: 'United Arab Emirates',
  沙特阿拉伯: 'Saudi Arabia',
  南非: 'South Africa',
  埃及: 'Egypt',
  越南: 'Vietnam',
  泰国: 'Thailand',
  菲律宾: 'Philippines',
  马来西亚: 'Malaysia',
  蒙古: 'Mongolia',
  摩尔多瓦: 'Moldova',
  希腊: 'Greece',
  捷克: 'Czechia',
  罗马尼亚: 'Romania',
  匈牙利: 'Hungary',
  巴基斯坦: 'Pakistan',
  孟加拉国: 'Bangladesh',
  智利: 'Chile',
  哥伦比亚: 'Colombia',
  秘鲁: 'Peru',
  老挝: 'Laos',
  柬埔寨: 'Cambodia',
  缅甸: 'Myanmar',
  尼泊尔: 'Nepal',
  新加坡: 'Singapore',
};

// 地图着色渐变（浅 → 深），两种视图共用
const COLOR_RANGE = ['#e8e6f8', '#a99df0', '#7c6cf0', '#5b4ad6'];

interface GeoDistributionMapProps {
  provinces: VisitorProvinceItem[];
  countries: VisitorCountryItem[];
}

type MapDatum = { name: string; value: number; displayName: string; requests: number | null };

// GeoJSON 懒加载注册（每种地图只注册一次）
const geoJsonLoaders = new Map<string, Promise<void>>();

function loadGeoJson(mapName: string, url: string, nameProperty: string): Promise<void> {
  const existing = geoJsonLoaders.get(mapName);
  if (existing) return existing;
  const loader = fetch(url)
    .then((resp) => {
      if (!resp.ok) throw new Error(`地图数据加载失败: HTTP ${resp.status}`);
      return resp.json();
    })
    .then((geoJson) => {
      // 世界 GeoJSON 的国界字段为 NAME，统一改写为小写 name 供 echarts 识别；
      // 南极洲无访客，剔除后主大陆可占满画布
      const features = geoJson.features as Array<Record<string, unknown>>;
      const kept = features.filter((feature) => {
        const props = (feature.properties ?? {}) as Record<string, unknown>;
        return props.NAME !== 'Antarctica';
      });
      for (const feature of kept) {
        const props = feature.properties as Record<string, unknown> | null;
        if (props && props[nameProperty] != null && props.name == null) {
          props.name = props[nameProperty];
        }
      }
      geoJson.features = kept;
      echarts.registerMap(mapName, geoJson as never);
    })
    .catch((error) => {
      geoJsonLoaders.delete(mapName);
      throw error;
    });
  geoJsonLoaders.set(mapName, loader);
  return loader;
}

function buildChinaData(provinces: VisitorProvinceItem[]): MapDatum[] {
  return provinces
    .filter((item) => PROVINCE_FULL_NAME[item.province])
    .map((item) => ({
      name: PROVINCE_FULL_NAME[item.province],
      value: item.unique_visitors,
      displayName: item.province,
      requests: item.requests,
    }));
}

function buildWorldData(countries: VisitorCountryItem[]): MapDatum[] {
  return countries
    .filter((item) => COUNTRY_ENGLISH_NAME[item.country])
    .map((item) => ({
      name: COUNTRY_ENGLISH_NAME[item.country],
      value: item.unique_visitors,
      displayName: item.country,
      requests: item.requests,
    }));
}

export default function GeoDistributionMap({ provinces, countries }: GeoDistributionMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  const [mode, setMode] = useState<MapViewMode>('china');
  const [loadError, setLoadError] = useState<string | null>(null);

  const isChina = mode === 'china';
  const data = isChina ? buildChinaData(provinces) : buildWorldData(countries);
  const maxVisitors = Math.max(...data.map((item) => item.value), 1);

  useEffect(() => {
    let disposed = false;

    const requestsByName = new Map(data.map((item) => [item.name, item.requests]));

    const geoConfig = isChina
      ? { mapName: CHINA_MAP_NAME, url: CHINA_GEO_URL, nameProperty: 'name' }
      : { mapName: WORLD_MAP_NAME, url: WORLD_GEO_URL, nameProperty: GEO_NAME_PROPERTY };

    const renderChart = () => {
      if (disposed || !containerRef.current) return;
      const chart = chartRef.current ?? echarts.init(containerRef.current);
      chartRef.current = chart;
      chart.setOption(
        {
          tooltip: {
            trigger: 'item',
            formatter: (params: { name?: string; value?: number | string }) => {
              if (params.value == null || Number.isNaN(Number(params.value))) {
                return `${params.name}<br/>暂无访客`;
              }
              const requests = requestsByName.get(params.name ?? '');
              const requestText =
                requests != null ? `，请求 ${requests.toLocaleString()} 次` : '';
              return `${params.name}<br/>访客 ${params.value} 位${requestText}`;
            },
          },
          visualMap: {
            type: 'continuous',
            min: 0,
            max: maxVisitors,
            left: 12,
            bottom: 16,
            text: ['多', '少'],
            calculable: true,
            inRange: { color: COLOR_RANGE },
          },
          series: [
            {
              type: 'map',
              map: geoConfig.mapName,
              // 滚轮缩放 + 拖拽平移，便于放大查看小区域（缩放范围 1~6 倍）
              roam: true,
              scaleLimit: { min: 1, max: 6 },
              selectedMode: false,
              layoutCenter: ['50%', '50%'],
              layoutSize: '100%',
              label: { show: false },
              emphasis: {
                label: { show: true },
                itemStyle: { areaColor: '#f59e0b' },
              },
              itemStyle: {
                borderColor: 'rgba(128, 128, 128, 0.35)',
                borderWidth: 0.5,
              },
              data,
            },
          ],
        },
        { notMerge: true },
      );
      chart.resize();
    };

    loadGeoJson(geoConfig.mapName, geoConfig.url, geoConfig.nameProperty)
      .then(() => {
        if (disposed) return;
        setLoadError(null);
        renderChart();
      })
      .catch((error) => {
        if (!disposed) setLoadError(error instanceof Error ? error.message : '地图数据加载失败');
      });

    const handleResize = () => chartRef.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      window.removeEventListener('resize', handleResize);
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, [mode, isChina, data, maxVisitors]);

  return (
    <div className="va-map-wrap">
      <div className="va-map-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={isChina}
          className={`wc-tab ${isChina ? 'active' : ''}`}
          onClick={() => setMode('china')}
        >
          中国分布
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={!isChina}
          className={`wc-tab ${!isChina ? 'active' : ''}`}
          onClick={() => setMode('world')}
        >
          全球分布
        </button>
      </div>
      {loadError && <p className="va-map-error">{loadError}</p>}
      <div ref={containerRef} className="va-map-canvas" />
      <p className="va-map-hint">提示：滚轮缩放地图，按住拖拽平移；悬停查看访客数与请求次数</p>
    </div>
  );
}
