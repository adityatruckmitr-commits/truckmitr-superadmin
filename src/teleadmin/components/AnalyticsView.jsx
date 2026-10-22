import { Line, Bar } from 'react-chartjs-2';
import { TrendingUp, Users, Phone, Target, Award, MapPin } from 'lucide-react-teleadmin';

const AnalyticsView = ({ stats, analytics, jobs }) => {
  if (!analytics) return null;

  // Applications vs Required Chart Data
  const appsVsRequiredData = {
    labels: analytics.applicationsPerJob.map(j => j.jobId),
    datasets: [
      {
        label: 'Applications Received',
        data: analytics.applicationsPerJob.map(j => j.applications),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        borderRadius: 10
      },
      {
        label: 'Drivers Required',
        data: analytics.applicationsPerJob.map(j => j.required),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        borderRadius: 10
      }
    ]
  };

  // Telecaller Performance Data
  const telecallerData = {
    labels: analytics.telecallerStats.map(tc => tc.name),
    datasets: [
      {
        label: 'Total Jobs',
        data: analytics.telecallerStats.map(tc => tc.totalJobs),
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 2
      },
      {
        label: 'Active Jobs',
        data: analytics.telecallerStats.map(tc => tc.activeJobs),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InsightCard
          title="Application Success Rate"
          value={`${analytics.applicationRatio}x`}
          description="Applications per position"
          icon={Target}
          color="from-purple-500 to-pink-600"
        />
        <InsightCard
          title="Total Calls Made"
          value={stats?.totalCalls || 0}
          description={`${stats?.matchRate || 0}% match rate`}
          icon={Phone}
          color="from-blue-500 to-indigo-600"
        />
        <InsightCard
          title="Active Positions"
          value={analytics.totalDriversRequired}
          description={`${analytics.totalApplications} applications`}
          icon={Users}
          color="from-green-500 to-emerald-600"
        />
      </div>

      {/* Applications vs Required - Bar Chart */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Award className="w-7 h-7 text-yellow-400" />
          Applications vs Drivers Required (Top 10 Jobs)
        </h3>
        <div className="h-96">
          <Bar
            data={appsVsRequiredData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    color: 'white',
                    font: { size: 14, weight: 'bold' },
                    padding: 20
                  }
                },
                tooltip: {
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  titleColor: 'white',
                  bodyColor: 'white',
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  borderWidth: 1,
                  padding: 12,
                  displayColors: true
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    color: 'white',
                    font: { weight: 'bold' }
                  },
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                  }
                },
                x: {
                  ticks: {
                    color: 'white',
                    font: { weight: 'bold' }
                  },
                  grid: {
                    display: false
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Telecaller Performance Comparison */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Users className="w-7 h-7 text-green-400" />
          Telecaller Performance Comparison
        </h3>
        <div className="h-96">
          <Bar
            data={telecallerData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                  labels: {
                    color: 'white',
                    font: { size: 14, weight: 'bold' },
                    padding: 20
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    color: 'white',
                    font: { weight: 'bold' }
                  },
                  grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                  }
                },
                x: {
                  ticks: {
                    color: 'white',
                    font: { weight: 'bold' }
                  },
                  grid: {
                    display: false
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Detailed Job Analysis Table */}
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 shadow-2xl">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-indigo-400" />
          Detailed Job Analysis
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left text-white font-bold p-4">Job ID</th>
                <th className="text-left text-white font-bold p-4">Title</th>
                <th className="text-center text-white font-bold p-4">Applications</th>
                <th className="text-center text-white font-bold p-4">Required</th>
                <th className="text-center text-white font-bold p-4">Ratio</th>
                <th className="text-center text-white font-bold p-4">Fill Rate</th>
              </tr>
            </thead>
            <tbody>
              {analytics.applicationsPerJob.map((job, idx) => (
                <tr key={idx} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                  <td className="p-4 text-indigo-300 font-medium">{job.jobId}</td>
                  <td className="p-4 text-white">{job.title}</td>
                  <td className="p-4 text-center">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full font-bold">
                      {job.applications}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full font-bold">
                      {job.required}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full font-bold">
                      {job.ratio}x
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            job.ratio >= 1 ? 'bg-green-500' : 'bg-yellow-500'
                          }`}
                          style={{ width: `${Math.min((job.applications / job.required) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-white text-sm font-bold min-w-[50px]">
                        {Math.min(Math.round((job.applications / job.required) * 100), 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const InsightCard = ({ title, value, description, icon: Icon, color }) => {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-3xl p-6 shadow-2xl transform hover:scale-105 transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-12 h-12 text-white/80" />
        <div className="bg-white/20 backdrop-blur-xs rounded-full px-4 py-1">
          <span className="text-white text-sm font-bold">Live</span>
        </div>
      </div>
      <h3 className="text-white/90 text-lg font-semibold mb-2">{title}</h3>
      <p className="text-5xl font-black text-white mb-2">{value}</p>
      <p className="text-white/80 text-sm font-medium">{description}</p>
    </div>
  );
};

export default AnalyticsView;
