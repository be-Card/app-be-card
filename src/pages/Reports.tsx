import React, { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ArcElement,
  BarElement,
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import { ChevronDown, Download, Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import reportsService, {
  VentasReportResponse,
  ConsumoReportResponse,
  ClientesReportResponse,
  ReportsQueryParams,
} from '../services/reportsService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: '#171717',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#333333',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      grid: {
        color: '#333333',
        // Chart.js v4: use border.display to hide axis border
        
      },
      border: {
        display: false,
      },
      ticks: {
        color: '#ffffff',
        font: {
          size: 12,
        },
        callback: function(value, index) {
          const labels = (this as any).chart?.data?.labels as string[] | undefined;
          const date = labels?.[index] ? new Date(labels[index]) : new Date();
          return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
        },
      },
    },
    y: {
      grid: {
        color: '#333333',
        
      },
      border: {
        display: false,
      },
      ticks: {
        color: '#ffffff',
        font: {
          size: 12,
        },
        callback: function(value) {
          return `${Number(value) / 1000}k`;
        },
      },
    },
  },
};

const pieChartOptions: ChartOptions<'pie'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: '#171717',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#333333',
      borderWidth: 1,
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.parsed;
          return `${label}: ${value}%`;
        },
      },
    },
  },
};

const baseBarChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'bottom' as const,
      labels: {
        color: '#ffffff',
        font: {
          size: 12,
          family: 'Inter',
        },
        usePointStyle: true,
        pointStyle: 'rect',
        padding: 20,
      },
    },
    tooltip: {
      backgroundColor: '#171717',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#333333',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      grid: {
        color: '#333333',
      },
      border: {
        display: false,
      },
      ticks: {
        color: '#ffffff',
        font: {
          size: 12,
          family: 'Inter',
        },
      },
    },
    y: {
      grid: {
        color: '#333333',
      },
      border: {
        display: false,
      },
      ticks: {
        color: '#ffffff',
        font: {
          size: 12,
          family: 'Inter',
        },
        callback: function (value) {
          return `${Number(value) / 1000}k`;
        },
      },
      beginAtZero: true,
    },
    y1: {
      position: 'right',
      grid: {
        display: false,
      },
      border: {
        display: false,
      },
      ticks: {
        color: '#ffffff',
        font: {
          size: 12,
          family: 'Inter',
        },
      },
      beginAtZero: true,
    },
  },
};

const Reports: React.FC = () => {
  const [reportType, setReportType] = useState('Ventas');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [currentPage, setCurrentPage] = useState(1);
  const [showReportDropdown, setShowReportDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ventasReport, setVentasReport] = useState<VentasReportResponse | null>(null);
  const [consumoReport, setConsumoReport] = useState<ConsumoReportResponse | null>(null);
  const [clientesReport, setClientesReport] = useState<ClientesReportResponse | null>(null);

  const reportTypes = ['Ventas', 'Consumo', 'Clientes'];
  const itemsPerPage = 6;

  const formatDateRange = (from: string, to: string) => {
    const f = new Date(from);
    const t = new Date(to);
    const fStr = f.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
    const tStr = t.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '');
    return `${fStr} - ${tStr}`;
  };

  const queryParams: ReportsQueryParams = useMemo(() => ({ date_from: dateFrom, date_to: dateTo }), [dateFrom, dateTo]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        if (reportType === 'Ventas') {
          const res = await reportsService.getVentasReport(queryParams);
          if (!cancelled) setVentasReport(res);
        } else if (reportType === 'Consumo') {
          const res = await reportsService.getConsumoReport(queryParams);
          if (!cancelled) setConsumoReport(res);
        } else {
          const res = await reportsService.getClientesReport(queryParams);
          if (!cancelled) setClientesReport(res);
        }
        if (!cancelled) setCurrentPage(1);
      } catch (e: any) {
        if (!cancelled) setError(e?.response?.data?.detail || 'No se pudo cargar el reporte');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [reportType, queryParams]);

  const ventasDatos = ventasReport?.datos || [];
  const totalPages = Math.max(1, Math.ceil(ventasDatos.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSales = ventasDatos.slice(startIndex, startIndex + itemsPerPage);

  const chartData = useMemo(() => {
    const labels = ventasDatos.map((d) => d.fecha);
    const values = ventasDatos.map((d) => d.ingresos);
    return {
      labels,
      datasets: [
        {
          label: 'Ingresos ($)',
          data: values,
          borderColor: '#f06f26',
          backgroundColor: 'transparent',
          borderWidth: 3,
          pointBackgroundColor: '#f06f26',
          pointBorderColor: '#f06f26',
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
        },
      ],
    };
  }, [ventasDatos]);

  const consumoDatos = consumoReport?.datos || [];
  const pieChartData = useMemo(() => {
    return {
      labels: consumoDatos.map((item) => item.estilo),
      datasets: [
        {
          data: consumoDatos.map((item) => item.porcentaje),
          backgroundColor: consumoDatos.map((item) => item.color),
          borderWidth: 0,
          hoverBorderWidth: 2,
          hoverBorderColor: '#ffffff',
        },
      ],
    };
  }, [consumoDatos]);

  const clientesDatos = clientesReport?.datos || [];
  const barChartData = useMemo(() => {
    return {
      labels: clientesDatos.map((item) => item.nivel),
      datasets: [
        {
          label: 'Cantidad de Clientes',
          data: clientesDatos.map((item) => item.cantidad),
          backgroundColor: '#f06f26',
          borderColor: '#f06f26',
          borderWidth: 0,
          borderRadius: 4,
          yAxisID: 'y1',
        },
        {
          label: 'Gasto Promedio ($)',
          data: clientesDatos.map((item) => item.gasto_promedio),
          backgroundColor: '#299d58',
          borderColor: '#299d58',
          borderWidth: 0,
          borderRadius: 4,
          yAxisID: 'y',
        },
      ],
    };
  }, [clientesDatos]);

  const barChartOptions = useMemo((): ChartOptions<'bar'> => {
    const maxGasto = Math.max(0, ...clientesDatos.map((d) => d.gasto_promedio));
    const maxCantidad = Math.max(0, ...clientesDatos.map((d) => d.cantidad));
    return {
      ...baseBarChartOptions,
      plugins: {
        ...baseBarChartOptions.plugins,
        tooltip: {
          ...baseBarChartOptions.plugins?.tooltip,
          callbacks: {
            label: function (context) {
              const label = context.dataset.label || '';
              const value = typeof context.parsed?.y === 'number' ? context.parsed.y : 0;
              if (context.dataset.yAxisID === 'y') return `${label}: $${value.toLocaleString()}`;
              return `${label}: ${value.toLocaleString()}`;
            },
          },
        },
      },
      scales: {
        ...baseBarChartOptions.scales,
        y: {
          ...(baseBarChartOptions.scales as any)?.y,
          suggestedMax: maxGasto ? Math.ceil(maxGasto * 1.15) : undefined,
        },
        y1: {
          ...(baseBarChartOptions.scales as any)?.y1,
          suggestedMax: maxCantidad ? Math.ceil(maxCantidad * 1.15) : undefined,
        },
      },
    };
  }, [clientesDatos]);

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const toCsv = (headers: string[], rows: Array<Array<string | number>>) => {
    const escape = (v: string | number) => {
      const s = String(v ?? '');
      const needsQuotes = /[",\n]/.test(s);
      const escaped = s.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    };
    const lines = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
    return `\uFEFF${lines}`;
  };

  const handleExportCSV = () => {
    if (reportType === 'Ventas') {
      const rows = ventasDatos.map((d) => [
        d.fecha,
        d.ingresos,
        d.litros_vendidos,
        d.transacciones,
        d.ticket_promedio,
      ]);
      downloadFile(
        `reporte-ventas-${dateFrom}-a-${dateTo}.csv`,
        toCsv(['Fecha', 'Ingresos', 'Litros Vendidos', 'Transacciones', 'Ticket Promedio'], rows),
        'text/csv;charset=utf-8;'
      );
      return;
    }
    if (reportType === 'Consumo') {
      const rows = consumoDatos.map((d) => [d.estilo, d.litros, d.porcentaje]);
      downloadFile(
        `reporte-consumo-${dateFrom}-a-${dateTo}.csv`,
        toCsv(['Estilo', 'Litros', 'Porcentaje'], rows),
        'text/csv;charset=utf-8;'
      );
      return;
    }
    const rows = clientesDatos.map((d) => [d.nivel, d.cantidad, d.gasto_promedio, d.gasto_total]);
    downloadFile(
      `reporte-clientes-${dateFrom}-a-${dateTo}.csv`,
      toCsv(['Nivel', 'Cantidad', 'Gasto Promedio', 'Gasto Total'], rows),
      'text/csv;charset=utf-8;'
    );
  };

  const handleExportPDF = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const title = `Reporte ${reportType} (${formatDateRange(dateFrom, dateTo)})`;
    let body = '';
    if (reportType === 'Ventas') {
      body = `
        <table>
          <thead><tr><th>Fecha</th><th>Ingresos</th><th>Litros Vendidos</th><th>Transacciones</th><th>Ticket Promedio</th></tr></thead>
          <tbody>
            ${ventasDatos
              .map(
                (d) =>
                  `<tr><td>${d.fecha}</td><td>$${d.ingresos.toFixed(2)}</td><td>${d.litros_vendidos.toFixed(
                    2
                  )}L</td><td>${d.transacciones}</td><td>$${d.ticket_promedio.toFixed(2)}</td></tr>`
              )
              .join('')}
          </tbody>
        </table>
      `;
    } else if (reportType === 'Consumo') {
      body = `
        <table>
          <thead><tr><th>Estilo</th><th>Litros</th><th>Porcentaje</th></tr></thead>
          <tbody>
            ${consumoDatos
              .map((d) => `<tr><td>${d.estilo}</td><td>${d.litros.toFixed(2)}L</td><td>${d.porcentaje}%</td></tr>`)
              .join('')}
          </tbody>
        </table>
      `;
    } else {
      body = `
        <table>
          <thead><tr><th>Nivel</th><th>Cantidad</th><th>Gasto Promedio</th><th>Gasto Total</th></tr></thead>
          <tbody>
            ${clientesDatos
              .map(
                (d) =>
                  `<tr><td>${d.nivel}</td><td>${d.cantidad}</td><td>$${d.gasto_promedio.toFixed(
                    2
                  )}</td><td>$${d.gasto_total.toFixed(2)}</td></tr>`
              )
              .join('')}
          </tbody>
        </table>
      `;
    }
    w.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body{font-family:Inter, Arial, sans-serif; padding:24px; color:#111}
            h1{font-size:18px; margin:0 0 8px}
            p{margin:0 0 16px; color:#444}
            table{width:100%; border-collapse:collapse; font-size:12px}
            th,td{border:1px solid #ddd; padding:8px; text-align:left}
            th{background:#f5f5f5}
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <p>Generado el ${new Date().toLocaleString('es-ES')}</p>
          ${body}
        </body>
      </html>
    `);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 200);
  };

  const getPaginationItems = (current: number, total: number): Array<number | 'ellipsis'> => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, 'ellipsis', total];
    if (current >= total - 3) return [1, 'ellipsis', total - 4, total - 3, total - 2, total - 1, total];
    return [1, 'ellipsis', current - 1, current, current + 1, 'ellipsis', total];
  };

  const handleReportTypeChange = (type: string) => {
    setReportType(type);
    setShowReportDropdown(false);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Content */}
      <div className="p-8 space-y-5">
        {/* Top Controls */}
        <div className="flex items-end gap-5">
          {/* Report Type */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-white mb-2.5 font-inter">
              Tipo de Reporte
            </label>
            <div className="relative">
              <button 
                onClick={() => setShowReportDropdown(!showReportDropdown)}
                className="w-full bg-[#1f1f1f] rounded-[10px] px-5 py-2.5 flex items-center justify-between text-sm font-light text-white font-inter"
              >
                <div className="flex items-center gap-2.5">
                  <Filter className="w-[18px] h-[18px]" />
                  <span>{reportType}</span>
                </div>
                <ChevronDown className="w-[18px] h-[18px] rotate-90" />
              </button>
              
              {showReportDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1f1f1f] border border-[#333333] rounded-[10px] z-10">
                  {reportTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() => handleReportTypeChange(type)}
                      className="w-full px-5 py-2.5 text-left text-sm font-light text-white font-inter hover:bg-[#333333] first:rounded-t-[10px] last:rounded-b-[10px]"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Date Range */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-white mb-2.5 font-inter">
              Rango de fechas
            </label>
            <div className="relative">
              <button
                onClick={() => setShowDateDropdown(!showDateDropdown)}
                className="w-full bg-[#1f1f1f] rounded-[10px] px-5 py-2.5 flex items-center justify-between text-sm font-light text-white font-inter"
              >
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-5 h-5" />
                  <span>{formatDateRange(dateFrom, dateTo)}</span>
                </div>
                <ChevronDown className="w-[18px] h-[18px] rotate-90" />
              </button>
              {showDateDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1f1f1f] border border-[#333333] rounded-[10px] z-10 p-4 space-y-3">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-white/70 mb-2 font-inter">Desde</label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full bg-[#171717] border border-[#333333] rounded-[10px] px-4 py-2 text-sm text-white font-inter"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-white/70 mb-2 font-inter">Hasta</label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full bg-[#171717] border border-[#333333] rounded-[10px] px-4 py-2 text-sm text-white font-inter"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDateDropdown(false)}
                    className="w-full rounded-[10px] px-5 py-2.5 text-sm font-semibold text-white font-inter bg-gradient-to-r from-[#f06f26] to-[#f1c112] hover:opacity-90 transition-opacity"
                  >
                    Aplicar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Export Buttons */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2.5 border border-white rounded-[10px] px-5 py-2.5 text-sm font-semibold text-white font-inter hover:bg-white/10 transition-colors"
          >
            <Download className="w-5 h-5" />
            Exportar CSV
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2.5 rounded-[10px] px-5 py-2.5 text-sm font-semibold text-white font-inter bg-gradient-to-r from-[#f06f26] to-[#f1c112] hover:opacity-90 transition-opacity"
          >
            <Download className="w-5 h-5" />
            Exportar PDF
          </button>
        </div>

        {/* Report Content */}
        {loading && (
          <div className="border border-[#333333] rounded-[10px] bg-[#171717] p-4 text-sm font-inter text-white/80">
            Cargando reporte...
          </div>
        )}
        {error && (
          <div className="border border-[#333333] rounded-[10px] bg-[#171717] p-4 text-sm font-inter text-white">
            {error}
          </div>
        )}
        {reportType === 'Ventas' ? (
          <>
            {/* Income Trend Chart */}
            <div className="border border-[#333333] rounded-[10px] bg-[#171717] p-[14px_19px]">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-white mb-1 font-inter">Tendencia de Ingresos</h2>
                <p className="text-sm font-light text-white font-inter">
                  Evolución de ventas en el período seleccionado
                </p>
              </div>
              
              <div className="h-[323px]">
                <Line data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* Daily Sales Detail Table */}
            <div className="border border-[#333333] rounded-[10px] bg-[#171717] p-[14px_19px]">
              <h2 className="text-lg font-bold text-white mb-2.5 py-2.5 font-inter">
                Detalle de Ventas Diarias
              </h2>

              {/* Table Header */}
              <div className="flex items-center px-5 py-2.5 gap-[90px]">
                <div className="w-[129px] text-sm font-semibold text-white/70 font-inter">Fecha</div>
                <div className="w-[126px] text-sm font-semibold text-white/70 font-inter">Ingresos</div>
                <div className="w-[179px] text-sm font-semibold text-white/70 font-inter">Litros Vendidos</div>
                <div className="w-[99px] text-sm font-semibold text-white/70 font-inter">Transacciones</div>
                <div className="text-sm font-semibold text-white/70 font-inter">Ticket Promedio</div>
              </div>

              {/* Table Separator */}
              <div className="h-px bg-[#333333] my-2.5"></div>

              {/* Table Rows */}
              {paginatedSales.map((row, index) => (
                <React.Fragment key={index}>
                  <div className="flex items-center px-5 py-2.5 gap-[90px]">
                    <div className="w-[133px] text-sm font-semibold text-white font-inter">{row.fecha}</div>
                    <div className="w-[127px] text-sm font-semibold text-[#299d58] font-inter">
                      ${row.ingresos.toFixed(2)}
                    </div>
                    <div className="w-[180px] text-sm font-semibold text-white font-inter">
                      {row.litros_vendidos.toFixed(2)}L
                    </div>
                    <div className="w-[99px] text-sm font-semibold text-white font-inter">{row.transacciones}</div>
                    <div className="w-[99px] text-sm font-semibold text-white font-inter">
                      ${row.ticket_promedio.toFixed(2)}
                    </div>
                  </div>
                  {index < paginatedSales.length - 1 && (
                    <div className="h-px bg-[#333333] my-2.5"></div>
                  )}
                </React.Fragment>
              ))}

              {/* Pagination */}
              <div className="flex items-center justify-between px-5 pt-2.5 mt-2.5">
                <span className="text-xs font-medium text-white font-inter">
                  Mostrando {Math.min(startIndex + 1, ventasDatos.length)}-{Math.min(startIndex + paginatedSales.length, ventasDatos.length)} de {ventasDatos.length} datos
                </span>
                
                <div className="flex items-center gap-2.5">
                  <button
                    className="border border-[#333333] rounded-[5px] p-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </button>

                  {getPaginationItems(currentPage, totalPages).map((item, idx) => {
                    if (item === 'ellipsis') {
                      return (
                        <span key={`ellipsis-${idx}`} className="w-[26px] h-[26px] flex items-center justify-center text-xs font-medium text-white/70 font-inter">
                          …
                        </span>
                      );
                    }

                    return (
                      <button
                        key={item}
                        onClick={() => setCurrentPage(item)}
                        className={`w-[26px] h-[26px] rounded-[5px] flex items-center justify-center text-xs font-medium font-inter transition-colors ${
                          currentPage === item ? 'bg-[#171717] text-white' : 'border border-[#333333] text-white hover:bg-white/10'
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                  
                  <button
                    className="border border-[#333333] rounded-[5px] p-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : reportType === 'Consumo' ? (
          <>
            {/* Consumption Reports */}
            <div className="flex gap-5">
              {/* Pie Chart */}
              <div className="flex-1 border border-[#333333] rounded-[10px] bg-[#171717] p-[14px_19px]">
                <div className="mb-5 p-2.5">
                  <h2 className="text-lg font-bold text-white mb-1 font-inter">Consumo por Estilo</h2>
                  <p className="text-sm font-light text-white font-inter">
                    Distribución de litros vendidos
                  </p>
                </div>
                
                <div className="h-[296px] flex items-center justify-center">
                  <div className="w-[296px] h-[296px]">
                    <Pie data={pieChartData} options={pieChartOptions} />
                  </div>
                </div>
              </div>

              {/* Details Table */}
              <div className="flex-1 border border-[#333333] rounded-[10px] bg-[#171717] p-[14px_19px]">
                <h2 className="text-lg font-bold text-white mb-2.5 p-2.5 font-inter">
                  Detalle por Estilo
                </h2>

                {/* Table Header */}
                <div className="flex items-center justify-between px-5 py-2.5">
                  <div className="w-[98px] text-sm font-semibold text-white/70 font-inter">Estilo</div>
                  <div className="text-sm font-semibold text-white/70 font-inter">Litros</div>
                  <div className="text-sm font-semibold text-white/70 font-inter">Porcentaje</div>
                </div>

                {/* Table Separator */}
                <div className="h-px bg-[#333333] my-2.5"></div>

                {/* Table Rows */}
                {consumoDatos.map((row, index) => (
                  <React.Fragment key={index}>
                    <div className="flex items-center justify-between px-5 py-2.5">
                      <div className="flex items-center gap-1.5 w-[98px]">
                        <div 
                          className="w-[15px] h-[15px] rounded-full flex-shrink-0"
                          style={{ backgroundColor: row.color }}
                        ></div>
                        <span className="text-sm font-semibold text-white font-inter">{row.estilo}</span>
                      </div>
                      <div className="text-sm font-semibold text-white font-inter">{row.litros.toFixed(2)}L</div>
                      <div className="text-sm font-semibold text-white font-inter">{row.porcentaje}%</div>
                    </div>
                    {index < consumoDatos.length - 1 && (
                      <div className="h-px bg-[#333333] my-2.5"></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Client Segmentation Chart */}
            <div className="border border-[#333333] rounded-[10px] bg-[#171717] p-[14px_19px]">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-white mb-1 font-inter">Segmentación de Clientes</h2>
                <p className="text-sm font-light text-white font-inter">
                  Distribución por nivel de fidelización
                </p>
              </div>
              
              <div className="h-[323px]">
                <Bar data={barChartData as any} options={barChartOptions} />
              </div>
            </div>

            {/* Client Statistics Table */}
            <div className="border border-[#333333] rounded-[10px] bg-[#171717] p-[14px_19px]">
              <h2 className="text-lg font-bold text-white mb-2.5 py-2.5 font-inter">
                Estadísticas por Nivel
              </h2>

              {/* Table Header */}
              <div className="flex items-center justify-between px-5 py-2.5">
                <div className="w-[129px] text-sm font-semibold text-white/70 font-inter">Nivel</div>
                <div className="w-[179px] text-sm font-semibold text-white/70 font-inter">Cantidad</div>
                <div className="w-[126px] text-sm font-semibold text-white/70 font-inter">Gasto Promedio</div>
                <div className="w-[99px] text-sm font-semibold text-white/70 font-inter">Gasto Total</div>
              </div>

              {/* Table Separator */}
              <div className="h-px bg-[#333333] my-2.5"></div>

              {/* Table Rows */}
              {clientesDatos.map((row, index) => (
                <React.Fragment key={index}>
                  <div className="flex items-center justify-between px-5 py-2.5">
                    <div className="w-[133px] text-sm font-semibold text-white font-inter">{row.nivel}</div>
                    <div className="w-[180px] text-sm font-semibold text-white font-inter">{row.cantidad}</div>
                    <div className="w-[127px] text-sm font-semibold text-[#299d58] font-inter">
                      ${row.gasto_promedio.toLocaleString()}
                    </div>
                    <div className="w-[99px] text-sm font-semibold text-white font-inter">
                      ${row.gasto_total.toLocaleString()}
                    </div>
                  </div>
                  {index < clientesDatos.length - 1 && (
                    <div className="h-px bg-[#333333] my-2.5"></div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
