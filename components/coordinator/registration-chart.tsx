"use client"

import { useEffect, useState } from "react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type ChartOptions,
} from "chart.js"
import { Skeleton } from "@/components/ui/skeleton"

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
)

type ChartDataPoint = {
  date: string
  registrations: number
  payments: number
}

interface RegistrationChartProps {
  chapterId: number
}

export function RegistrationChart({ chapterId }: RegistrationChartProps) {
  const [chartData, setChartData] = useState<ChartData<"line">>({
    datasets: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Fetch real data from API
        const response = await fetch(`/api/coordinator/dashboard/chart?chapterId=${chapterId}`)
        if (!response.ok) throw new Error("Failed to fetch chart data")

        const data: ChartDataPoint[] = await response.json()

        // Extract dates and values
        const labels = data.map((item) => item.date)
        const registrationData = data.map((item) => item.registrations)
        const paymentData = data.map((item) => item.payments)

        setChartData({
          labels,
          datasets: [
            {
              label: "Registrations",
              data: registrationData,
              borderColor: "rgb(59, 130, 246)",
              backgroundColor: "rgba(59, 130, 246, 0.5)",
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              pointBackgroundColor: "rgb(59, 130, 246)",
              pointBorderColor: "#fff",
              pointBorderWidth: 1,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
            {
              label: "Completed Payments",
              data: paymentData,
              borderColor: "rgb(34, 197, 94)",
              backgroundColor: "rgba(34, 197, 94, 0.3)",
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              pointBackgroundColor: "rgb(34, 197, 94)",
              pointBorderColor: "#fff",
              pointBorderWidth: 1,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        })
      } catch (error) {
        console.error("Error fetching chart data:", error)
        // If API fails, set demo chart data
        setChartData({
          labels: ["Apr 1", "Apr 5", "Apr 10", "Apr 15", "Apr 20", "Apr 25", "May 1", "May 5"],
          datasets: [
            {
              label: "Registrations",
              data: [15, 22, 36, 47, 58, 76, 98, 112],
              borderColor: "rgb(59, 130, 246)",
              backgroundColor: "rgba(59, 130, 246, 0.5)",
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              pointBackgroundColor: "rgb(59, 130, 246)",
              pointBorderColor: "#fff",
              pointBorderWidth: 1,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
            {
              label: "Completed Payments",
              data: [12, 18, 30, 40, 48, 62, 82, 92],
              borderColor: "rgb(34, 197, 94)",
              backgroundColor: "rgba(34, 197, 94, 0.3)",
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              pointBackgroundColor: "rgb(34, 197, 94)",
              pointBorderColor: "#fff",
              pointBorderWidth: 1,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [chapterId])

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 12,
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
        cornerRadius: 6,
        boxPadding: 6,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: () => 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          padding: 10,
          precision: 0,
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          padding: 10,
        }
      },
    },
    elements: {
      line: {
        borderWidth: 2,
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  }

  if (loading) {
    return (
      <div className="flex flex-col space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    )
  }

  if (chartData.labels?.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No registration data available
      </div>
    )
  }

  return (
    <div className="h-[300px]">
      <Line data={chartData} options={chartOptions} />
    </div>
  )
}
