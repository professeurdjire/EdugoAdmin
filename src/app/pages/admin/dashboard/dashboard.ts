import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  faBook, faBookMedical,
  faFlagCheckered,
  faMedal,
  faPlusCircle,
  faSquarePollHorizontal,
  faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { NgApexchartsModule, ApexChart, ApexTitleSubtitle, ApexXAxis, ApexYAxis, ApexPlotOptions, ApexDataLabels, ApexStroke, ApexFill, ApexLegend, ApexNonAxisChartSeries, ApexResponsive } from 'ng-apexcharts';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FaIconComponent,
    NgApexchartsModule,
    RouterLink,
],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard {
  // Icônes
  protected readonly faFlagCheckered = faFlagCheckered;
  protected readonly faSquarePollHorizontal = faSquarePollHorizontal;
  protected readonly faBook = faBook;
  protected readonly faUsers = faUsers;
  protected readonly faMedal = faMedal;
  protected readonly faPlusCircle = faPlusCircle;
  protected readonly faBookMedical = faBookMedical;

  // Configuration typée pour ApexCharts
  public chartOptions: {
    series: any[];
    chart: ApexChart;
    dataLabels: ApexDataLabels;
    plotOptions: ApexPlotOptions;
    xaxis: ApexXAxis;
    yaxis: ApexYAxis;
    stroke: ApexStroke;
    fill: ApexFill;
    colors: string[];
    legend: ApexLegend;
    title: ApexTitleSubtitle;
  } = {
    series: [
      {
        name: 'Utilisateurs actifs',
        data: [65, 59, 80, 81, 56, 55, 40]
      },
      {
        name: 'Quiz complétés',
        data: [28, 48, 40, 19, 86, 27, 90]
      }
    ],
    chart: {
      type: 'bar' as ApexChart['type'],
      height: 340,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 5
      }
    },
    dataLabels: {
      enabled: false
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    },
    xaxis: {
      categories: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
    },
    fill: {
      opacity: 1
    },
    colors: ['#36a2eb', '#4bc0c0'],
    legend: {
      position: 'top',
      horizontalAlign: 'right'
    },
    yaxis: {
      title: {
        text: 'Nombre'
      }
    },
    title: {
      text: undefined
    }
  };

  // Donut: Répartition de lecture par matière
  public readingDonutOptions: {
    series: ApexNonAxisChartSeries;
    chart: ApexChart;
    labels: string[];
    colors: string[];
    dataLabels: ApexDataLabels;
    legend: ApexLegend;
    plotOptions: ApexPlotOptions;
    responsive: ApexResponsive[];
    stroke: ApexStroke;
  } = {
    series: [15, 12, 10, 8, 7, 6, 5, 4],
    chart: {
      type: 'donut',
      height: 200,
      width: 200,
      parentHeightOffset: 0,
      toolbar: { show: false },
      animations: { enabled: true }
    },
    labels: [
      'Mathématiques',
      'Français',
      'Histoires',
      'Géographie',
      'Anglais',
      'ECM',
      'Physique',
      'Chimie'
    ],
    colors: [
      '#4a68f2', // maths
      '#37c75b', // francais
      '#ff914d', // histoires
      '#ff3e3e', // geographie
      '#ffdd00', // anglais
      '#9013fe', // ecm
      '#1b4965', // physique
      '#777'     // chimie
    ],
    dataLabels: {
      enabled: false
    },
    stroke: {
      width: 2,
      colors: ['#ffffff']
    },
    legend: {
      show: false
    },
    plotOptions: {
      pie: {
        expandOnClick: false,
        donut: {
          size: '55%'
        }
      }
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: { height: 220, width: 220 }
        }
      }
    ]
  };
}
