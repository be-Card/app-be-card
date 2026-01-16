import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Users,
  Droplet,
  Activity,
  TrendingUp,
  TrendingDown,
  Settings,
  CheckCircle,
  AlertTriangle,
  XCircle,
  QrCode,
  Wifi,
  CreditCard,
  Banknote
} from 'lucide-react';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import styles from './Dashboard.module.scss';
import dashboardService, { CervezaPopular, ClienteTop, CanillaDashboard } from '../services/dashboardService';
import { useToast } from '../contexts/ToastContext';
import { Link } from 'react-router-dom';

ChartJS.register(ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface KPIData {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative';
  icon: React.ReactNode;
}

const Dashboard: React.FC = () => {
  const [kpiData, setKpiData] = useState<KPIData[]>([]);
  const [top5Cervezas, setTop5Cervezas] = useState<any[]>([]);
  const [top5Clientes, setTop5Clientes] = useState<any[]>([]);
  const [canillas, setCanillas] = useState<CanillaDashboard[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [distributionItems, setDistributionItems] = useState<Array<{ label: string; porcentaje: number; color: string }>>([]);
  const [salesSeries, setSalesSeries] = useState<{ labels: string[]; values: number[] }>({ labels: [], values: [] });
  const [salesRange, setSalesRange] = useState<'week' | 'month'>('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    loadDashboardData();
  }, [salesRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const days = salesRange === 'week' ? 7 : 30;

      const [
        kpisDia,
        ventasPorDia,
        distribucion,
        canillasRes,
        metodosPagoHoy,
        cervezasData,
        clientesData,
      ] = await Promise.all([
        dashboardService.getKPIsDia(),
        dashboardService.getVentasPorDia(days),
        dashboardService.getDistribucionEstilo(days),
        dashboardService.getCanillas(6),
        dashboardService.getMetodosPagoHoy(),
        dashboardService.getCervezasPopulares(days, 5),
        dashboardService.getClientesTop(days, 5),
      ]);

      // Transformar KPIs a formato del componente
      const formattedKPIs: KPIData[] = [
        {
          title: "Ingresos del Día",
          value: `$${kpisDia.ingresos_dia.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
          change: `${kpisDia.ingresos_cambio_pct >= 0 ? '+' : ''}${kpisDia.ingresos_cambio_pct.toFixed(1)}% vs ayer`,
          changeType: kpisDia.ingresos_cambio_pct >= 0 ? 'positive' : 'negative',
          icon: <DollarSign size={24} />
        },
        {
          title: "Litros Servidos",
          value: `${kpisDia.litros_servidos.toLocaleString('es-AR', { maximumFractionDigits: 0 })} L`,
          change: `${kpisDia.litros_cambio_pct >= 0 ? '+' : ''}${kpisDia.litros_cambio_pct.toFixed(1)}% vs ayer`,
          changeType: kpisDia.litros_cambio_pct >= 0 ? 'positive' : 'negative',
          icon: <Droplet size={24} />
        },
        {
          title: "Clientes Únicos",
          value: kpisDia.clientes_unicos.toLocaleString('es-AR'),
          change: `${kpisDia.clientes_cambio_pct >= 0 ? '+' : ''}${kpisDia.clientes_cambio_pct.toFixed(1)}% vs ayer`,
          changeType: kpisDia.clientes_cambio_pct >= 0 ? 'positive' : 'negative',
          icon: <Users size={24} />
        },
        {
          title: "Consumo Promedio",
          value: `$${kpisDia.consumo_promedio.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
          change: `${kpisDia.consumo_cambio_pct >= 0 ? '+' : ''}${kpisDia.consumo_cambio_pct.toFixed(1)}% vs ayer`,
          changeType: kpisDia.consumo_cambio_pct >= 0 ? 'positive' : 'negative',
          icon: <Activity size={24} />
        }
      ];

      setKpiData(formattedKPIs);

      const formattedCervezas = cervezasData.cervezas.map((cerveza: CervezaPopular, index: number) => ({
        rank: index + 1,
        name: cerveza.nombre,
        type: `${cerveza.tipo} • ${(cerveza.total_ml / 1000).toFixed(0)}L`,
        price: `$${cerveza.total_ventas.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      }));
      setTop5Cervezas(formattedCervezas);

      const formattedClientes = clientesData.clientes.map((cliente: ClienteTop, index: number) => ({
        rank: index + 1,
        name: cliente.nombre_completo,
        tier: (cliente.nivel as string) || (cliente.num_compras >= 10 ? 'Oro' : cliente.num_compras >= 5 ? 'Plata' : 'Bronce'),
        visits: `${cliente.num_compras} compras`,
        amount: `$${cliente.total_gastado.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
      }));
      setTop5Clientes(formattedClientes);

      setCanillas(canillasRes.canillas);

      const iconByMetodo = (metodo: string) => {
        const m = (metodo || '').toLowerCase();
        if (m.includes('qr')) return <QrCode size={20} />;
        if (m.includes('nfc') || m.includes('rfid')) return <Wifi size={20} />;
        if (m.includes('tarjeta') || m.includes('card')) return <CreditCard size={20} />;
        if (m.includes('efectivo') || m.includes('cash')) return <Banknote size={20} />;
        return <CreditCard size={20} />;
      };

      setPaymentMethods(
        metodosPagoHoy.metodos.map((m) => ({
          name: m.metodo,
          percentage: `${m.porcentaje}% del total`,
          amount: `$${m.monto.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
          icon: iconByMetodo(m.metodo),
          variant: (m.metodo || '').toLowerCase().includes('tarjeta') ? 'blue' : 'default',
        }))
      );

      const palette = ['#f06f26', '#3b82f6', '#10b981', '#f59e0b', '#299d58', '#a855f7', '#ef4444'];
      setDistributionItems(
        distribucion.datos.map((d, idx) => ({
          label: d.estilo,
          porcentaje: d.porcentaje,
          color: palette[idx % palette.length],
        }))
      );

      const filled = fillSeries(ventasPorDia.datos, days);
      setSalesSeries(filled);

    } catch {
      const errorMessage = 'Error al cargar los datos del dashboard. Por favor, intenta nuevamente.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fillSeries = (
    datos: Array<{ fecha: string; total: number }>,
    days: number
  ): { labels: string[]; values: number[] } => {
    const now = new Date();
    const labels: string[] = [];
    const values: number[] = [];
    const map = new Map<string, number>(datos.map((d) => [d.fecha, d.total]));

    if (days <= 7) {
      const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const dow = today.getUTCDay();
      const mondayOffset = (dow + 6) % 7;
      const start = new Date(today);
      start.setUTCDate(start.getUTCDate() - mondayOffset);

      const weekLabels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setUTCDate(d.getUTCDate() + i);
        const yyyy = d.getUTCFullYear();
        const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(d.getUTCDate()).padStart(2, '0');
        const key = `${yyyy}-${mm}-${dd}`;

        labels.push(weekLabels[i]);
        values.push(map.get(key) || 0);
      }

      return { labels, values };
    }

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      d.setUTCDate(d.getUTCDate() - i);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const key = `${yyyy}-${mm}-${dd}`;

      labels.push(`${dd}/${mm}`);
      values.push(map.get(key) || 0);
    }

    return { labels, values };
  };

  const distributionData = {
    labels: distributionItems.map((i) => i.label),
    datasets: [
      {
        data: distributionItems.map((i) => i.porcentaje),
        backgroundColor: distributionItems.map((i) => i.color),
        borderColor: distributionItems.map((i) => i.color),
        borderWidth: 2,
        hoverBorderWidth: 3,
        hoverOffset: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false // Usaremos nuestra propia leyenda personalizada
      },
      tooltip: {
        backgroundColor: '#1f1f1f',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#333333',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed}%`;
          }
        }
      }
    },
    cutout: '60%', // Hace que sea un doughnut en lugar de pie
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000
    },
    interaction: {
      intersect: false,
      mode: 'index' as const
    }
  };

  const salesChartData = {
    labels: salesSeries.labels,
    datasets: [
      {
        data: salesSeries.values,
        borderColor: '#f06f26',
        backgroundColor: 'rgba(240, 111, 38, 0.25)',
        tension: 0.4,
        fill: true,
        pointRadius: 0,
      }
    ]
  };

  const salesChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1f1f1f',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#333333',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: function(context: any) {
            const v = Number(context.parsed.y || 0);
            return `$${v.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(255,255,255,0.65)' }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.08)' },
        ticks: { color: 'rgba(255,255,255,0.65)' }
      }
    }
  };

  const getCanillaIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={20} className={styles.iconActive} />;
      case 'warning':
        return <AlertTriangle size={20} className={styles.iconWarning} />;
      case 'critical':
        return <XCircle size={20} className={styles.iconCritical} />;
      default:
        return <CheckCircle size={20} />;
    }
  };

  const getCanillaColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#299d58';
      case 'warning':
        return '#f8d02d';
      case 'critical':
        return '#ed2c2c';
      default:
        return '#299d58';
    }
  };

  const getTierBadgeClass = (tier: string) => {
    switch (tier) {
      case 'Oro':
        return styles.tierOro;
      case 'Plata':
        return styles.tierPlata;
      case 'Bronce':
        return styles.tierBronce;
      default:
        return styles.tierOro;
    }
  };

  if (loading) {
    return (
      <div className={styles.dashboard}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <div className={styles.loading}>
          <p>Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboard}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={loadDashboardData} className={styles.retryButton}>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.pageTitle}>Dashboard</h1>

      <div className={styles.content}>
          {/* KPIs */}
          <div className={styles.kpiGrid}>
            {kpiData.map((kpi, index) => (
              <div key={index} className={styles.kpiCard}>
                <div className={styles.kpiContent}>
                  <p className={styles.kpiTitle}>{kpi.title}</p>
                  <h3 className={styles.kpiValue}>{kpi.value}</h3>
                  <div className={styles.kpiChange}>
                    {kpi.changeType === 'positive' ? (
                      <TrendingUp size={16} className={styles.trendUp} />
                    ) : (
                      <TrendingDown size={16} className={styles.trendDown} />
                    )}
                    <span className={`${styles.changeText} ${styles[kpi.changeType]}`}>
                      {kpi.change}
                    </span>
                  </div>
                </div>
                <div className={styles.kpiIcon}>
                  {kpi.icon}
                </div>
              </div>
            ))}
          </div>

          {/* Charts Section */}
          <div className={styles.chartsSection}>
            <div className={styles.salesChart}>
              <div className={styles.chartHeader}>
                <h3 className={styles.chartTitle}>{salesRange === 'week' ? 'Ventas de la Semana' : 'Ventas del Mes'}</h3>
                <div className={styles.chartFilters}>
                  <button
                    className={`${styles.filterBtn} ${salesRange === 'week' ? styles.active : ''}`}
                    onClick={() => setSalesRange('week')}
                    type="button"
                  >
                    Semana
                  </button>
                  <button
                    className={`${styles.filterBtn} ${salesRange === 'month' ? styles.active : ''}`}
                    onClick={() => setSalesRange('month')}
                    type="button"
                  >
                    Mes
                  </button>
                </div>
              </div>
              <div className={styles.chartPlaceholder}>
                <div className={styles.chartArea}>
                  <Line data={salesChartData} options={salesChartOptions as any} />
                </div>
              </div>
            </div>

            <div className={styles.distributionChart}>
              <h3 className={styles.chartTitle}>Distribución por Estilo</h3>
              <div className={styles.chartContainer}>
                <div className={styles.doughnutChart}>
                  <Doughnut data={distributionData} options={chartOptions} />
                </div>
                <div className={styles.pieLabels}>
                  {distributionItems.map((item) => (
                    <div key={item.label} className={styles.pieLabel}>
                      <span className={styles.labelDot} style={{ background: item.color }}></span>
                      <span>{item.label} {item.porcentaje}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Estado de Canillas */}
          <div className={styles.canillasSection}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Estado de Canillas</h3>
              <Link to="/beers?tab=canillas" className={styles.manageBtn} style={{ textDecoration: 'none' }}>
                <Settings size={20} />
                <span>Gestionar Canillas</span>
              </Link>
            </div>
            
            <div className={styles.canillasGrid}>
              {canillas.map((canilla) => (
                <div key={canilla.id} className={styles.canillaCard}>
                  <div className={styles.canillaHeader}>
                    <span className={styles.canillaName}>{canilla.nombre}</span>
                    {getCanillaIcon(canilla.estado)}
                  </div>
                  <p className={styles.canillaBeer}>{canilla.cerveza}</p>
                  <div className={styles.canillaLevel}>
                    <span className={styles.levelLabel}>Nivel</span>
                    <span className={styles.levelValue}>{canilla.nivel_pct}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{
                        width: `${canilla.nivel_pct}%`,
                        backgroundColor: getCanillaColor(canilla.estado)
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 5 Sections */}
          <div className={styles.topSections}>
            <div className={styles.topCervezas}>
              <h3 className={styles.sectionTitle}>Top 5 Cervezas</h3>
              <div className={styles.topList}>
                {top5Cervezas.map((item) => (
                  <div key={item.rank} className={styles.topItem}>
                    <div className={styles.topItemLeft}>
                      <div className={`${styles.rankBadge} ${item.rank === 1 ? styles.rankFirst : ''}`}>
                        {item.rank}
                      </div>
                      <div className={styles.topItemInfo}>
                        <p className={styles.itemName}>{item.name}</p>
                        <p className={styles.itemType}>{item.type}</p>
                      </div>
                    </div>
                    <span className={styles.itemPrice}>{item.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.topClientes}>
              <h3 className={styles.sectionTitle}>Top 5 Clientes</h3>
              <div className={styles.topList}>
                {top5Clientes.map((item) => (
                  <div key={item.rank} className={styles.topItem}>
                    <div className={styles.topItemLeft}>
                      <div className={`${styles.rankBadge} ${item.rank === 1 ? styles.rankFirst : ''}`}>
                        {item.rank}
                      </div>
                      <div className={styles.topItemInfo}>
                        <div className={styles.clientInfo}>
                          <p className={styles.itemName}>{item.name}</p>
                          <span className={`${styles.tierBadge} ${getTierBadgeClass(item.tier)}`}>
                            {item.tier}
                          </span>
                        </div>
                        <p className={styles.itemType}>{item.visits}</p>
                      </div>
                    </div>
                    <span className={styles.itemPrice}>{item.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Métodos de Pago */}
          <div className={styles.paymentSection}>
            <h3 className={styles.sectionTitle}>Métodos de Pago (Hoy)</h3>
            <div className={styles.paymentGrid}>
              {paymentMethods.map((method, index) => (
                <div key={index} className={styles.paymentCard}>
                  <div className={`${styles.paymentIcon} ${method.variant === 'blue' ? styles.paymentIconBlue : ''}`}>
                    {method.icon}
                  </div>
                  <div className={styles.paymentInfo}>
                    <p className={styles.paymentName}>{method.name}</p>
                    <p className={styles.paymentPercentage}>{method.percentage}</p>
                  </div>
                  <span className={`${styles.paymentAmount} ${method.variant === 'blue' ? styles.paymentAmountBlue : ''}`}>
                    {method.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
    </div>
  );
};

export default Dashboard;
