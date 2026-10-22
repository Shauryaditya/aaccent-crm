const WIDTH = 720;
const HEIGHT = 260;
const PAD = { top: 24, right: 24, bottom: 44, left: 48 };
const plotWidth = WIDTH - PAD.left - PAD.right;
const plotHeight = HEIGHT - PAD.top - PAD.bottom;

const monthLabel = month => new Date(`${month}-01T12:00:00`).toLocaleDateString('en-IN', { month: 'short' });
const xAt = (index, length) => PAD.left + (length === 1 ? plotWidth / 2 : index * plotWidth / (length - 1));

function Grid({ maximum }) {
  return Array.from({ length: 5 }, (_, index) => {
    const value = Math.round(maximum * (4 - index) / 4);
    const y = PAD.top + index * plotHeight / 4;
    return <g key={`${value}-${index}`}>
      <line className="chart-grid-line" x1={PAD.left} x2={WIDTH - PAD.right} y1={y} y2={y} />
      <text className="chart-axis-label" x={PAD.left - 10} y={y + 4} textAnchor="end">{value}</text>
    </g>;
  });
}

function TotalStudentsChart({ rows }) {
  const maximum = Math.max(1, ...rows.map(row => row.total));
  const points = rows.map((row, index) => ({
    ...row,
    x: xAt(index, rows.length),
    y: PAD.top + plotHeight - (row.total / maximum) * plotHeight
  }));

  return <article className="growth-chart-card">
    <div className="growth-chart-title"><div><h3>Total students</h3><p>Active enrollment at the close of each month</p></div><span className="chart-legend chart-legend-total">Students</span></div>
    <div className="growth-chart-scroll">
      <svg className="growth-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Line chart of total active students by month">
        <Grid maximum={maximum} />
        <polyline className="chart-total-area" points={`${PAD.left},${PAD.top + plotHeight} ${points.map(point => `${point.x},${point.y}`).join(' ')} ${points.at(-1)?.x ?? PAD.left},${PAD.top + plotHeight}`} />
        <polyline className="chart-total-line" points={points.map(point => `${point.x},${point.y}`).join(' ')} />
        {points.map(point => <g key={point.month}>
          <circle className="chart-total-point" cx={point.x} cy={point.y} r="5"><title>{monthLabel(point.month)}: {point.total} students</title></circle>
          <text className="chart-value-label" x={point.x} y={Math.max(PAD.top + 12, point.y - 10)} textAnchor="middle">{point.total}</text>
          <text className="chart-axis-label" x={point.x} y={HEIGHT - 16} textAnchor="middle">{monthLabel(point.month)}</text>
        </g>)}
      </svg>
    </div>
  </article>;
}

function MovementChart({ rows }) {
  const maximum = Math.max(1, ...rows.flatMap(row => [row.added, row.removed]));
  const groupWidth = plotWidth / rows.length;
  const barWidth = Math.min(18, Math.max(8, groupWidth * 0.28));

  return <article className="growth-chart-card">
    <div className="growth-chart-title"><div><h3>Student movement</h3><p>Students joining or returning compared with removals</p></div><div className="chart-legend-group"><span className="chart-legend chart-legend-added">Added</span><span className="chart-legend chart-legend-removed">Removed</span></div></div>
    <div className="growth-chart-scroll">
      <svg className="growth-chart" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Bar chart comparing students added and removed each month">
        <Grid maximum={maximum} />
        {rows.map((row, index) => {
          const center = PAD.left + groupWidth * (index + 0.5);
          const addedHeight = row.added / maximum * plotHeight;
          const removedHeight = row.removed / maximum * plotHeight;
          return <g key={row.month}>
            <rect className="chart-bar-added" x={center - barWidth - 2} y={PAD.top + plotHeight - addedHeight} width={barWidth} height={addedHeight} rx="3"><title>{monthLabel(row.month)}: {row.added} added or returned</title></rect>
            <rect className="chart-bar-removed" x={center + 2} y={PAD.top + plotHeight - removedHeight} width={barWidth} height={removedHeight} rx="3"><title>{monthLabel(row.month)}: {row.removed} removed</title></rect>
            <text className="chart-axis-label" x={center} y={HEIGHT - 16} textAnchor="middle">{monthLabel(row.month)}</text>
          </g>;
        })}
      </svg>
    </div>
  </article>;
}

export default function GrowthCharts({ rows }) {
  if (!rows.length) return <p>No monthly growth data is available for this year.</p>;
  return <div className="growth-charts"><TotalStudentsChart rows={rows} /><MovementChart rows={rows} /></div>;
}
