"use client"

import { useEffect, useState } from "react"
import { Bar } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from "chart.js"
import { Skeleton } from "@/components/ui/skeleton"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

type ChapterData = {
  name: string
  registrations: number[]
  color: {
    bg: string
    border: string
  }
}

export function AdminChart() {
  const [chartData, setChartData] = useState<ChartData<'bar'>>({
    labels: [],
    datasets: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        // Fetch real data from API
        const response = await fetch("/api/admin/dashboard/chart")
        if (!response.ok) throw new Error("Failed to fetch chart data")

        const data: { dates: string[]; chapters: ChapterData[] } = await response.json()

        setChartData({
          labels: data.dates,
          datasets: data.chapters.map((chapter, index) => ({
            label: chapter.name,
            data: chapter.registrations,
            backgroundColor: chapter.color.bg,
            borderColor: chapter.color.border,
            borderWidth: 1,
            // Add any other required chart.js dataset properties
            barThickness: 10,
            maxBarThickness: 12
          })),
        })
      } catch (error) {
        console.error("Error fetching chart data:", error)
        // If API fails, set demo chart data
        setChartData({
          labels: ["Apr 1", "Apr 8", "Apr 15", "Apr 22", "Apr 29", "May 6"],
          datasets: [
            {
              label: "Abuja Chapter",
              data: [35, 42, 55, 67, 85, 98],
              backgroundColor: "rgba(59, 130, 246, 0.7)",
              borderColor: "rgb(37, 99, 235)",
              borderWidth: 1,
              borderRadius: 4,
              hoverBackgroundColor: "rgba(59, 130, 246, 0.9)"
            },
            {
              label: "Lagos Chapter",
              data: [42, 58, 65, 84, 95, 115],
              backgroundColor: "rgba(16, 185, 129, 0.7)",
              borderColor: "rgb(5, 150, 105)",
              borderWidth: 1,
              borderRadius: 4,
              hoverBackgroundColor: "rgba(16, 185, 129, 0.9)"
            },
            {
              label: "Kano Chapter",
              data: [28, 35, 42, 56, 64, 78],
              backgroundColor: "rgba(245, 158, 11, 0.7)",
              borderColor: "rgb(217, 119, 6)",
              borderWidth: 1,
              borderRadius: 4,
              hoverBackgroundColor: "rgba(245, 158, 11, 0.9)"
            }
          ],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [])

  const chartOptions: ChartOptions<'bar'> = {
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
          color: 'rgba(0, 0, 0, 0.05)',
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
      <Bar data={chartData} options={chartOptions} />
    </div>
  )
}
