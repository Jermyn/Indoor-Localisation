import React from "react";
import { render } from "react-dom";
import {connect} from "react-redux";
import { withStyles } from "@material-ui/core/styles";
// import Chart from "./Chart";
import 'chartjs-plugin-streaming';
import { Line } from 'react-chartjs-2';

const styles = theme => ({
  "chart-container": {
    height: 400
  }
});

class AccelerationChart extends React.Component {
  state = {
    chartpointsX : [],
    chartpointsY : [],
    chartpointsZ : [],
    lineChartData: {
      datasets: [
        {
          label: "ACCX",
          backgroundColor: "rgba(0, 0, 0, 0)",
          showLine: true,
          borderColor: this.props.theme.palette.primary.main,
          pointBackgroundColor: this.props.theme.palette.secondary.main,
          pointBorderColor: this.props.theme.palette.secondary.main,
          borderWidth: "2",
          lineTension: 0,
          pointRadius: 0,
          data: []
        },
        // {
        //   label: "ACCY",
        //   backgroundColor: "rgba(0, 0, 0, 0)",
        //   showLine: true,
        //   borderColor: this.props.theme.palette.secondary.main,
        //   pointBackgroundColor: this.props.theme.palette.secondary.main,
        //   pointBorderColor: this.props.theme.palette.secondary.main,
        //   borderWidth: "2",
        //   lineTension: 0,
        //   pointRadius: 0,
        //   data: []
        // },
        // {
        //   label: "ACCZ",
        //   backgroundColor: "rgba(0, 0, 0, 0)",
        //   showLine: true,
        //   borderColor: this.props.theme.palette.secondary.main,
        //   pointBackgroundColor: this.props.theme.palette.secondary.main,
        //   pointBorderColor: this.props.theme.palette.secondary.main,
        //   borderWidth: "2",
        //   lineTension: 0,
        //   pointRadius: 0,
        //   data: []
        // },
      ]
    },
    lineChartOptions: {
      events: [],
      responsive: true,
      maintainAspectRatio: false,
      showLine: true,

      legend: {
        display: false,
      },

      elements: {

      },
      tooltips: {
        enabled: true
      },
      plugins: {
        streaming: {
          frameRate: 30
        }
      },
      scales: {
        xAxes: [
          {
            type: 'realtime',
            realtime: {
              duration: 30000,
              delay: 500,
              pause: false,

            },
            ticks: {
              autoSkip: false,
              maxTicksLimit: 10
            }
          }
        ]
      }
    },
  };

  componentDidUpdate(prevProps, prevState) {
    if(prevProps.acc !== undefined && this.props.acc !== prevProps.acc ) {
      let vitals = this.props.acc

      const oldBtcDataSet = this.state.lineChartData.datasets[0];

      let value = vitals.accY
      let epoch = vitals.timestamp;
      let date = new Date(epoch)


      const newBtcDataSet = { ...oldBtcDataSet };
      let vitalSign = {x: epoch, y: value}

      newBtcDataSet.data.push(vitalSign);

      const newChartData = {
        ...this.state.lineChartData,
        datasets: [newBtcDataSet],

      };


      this.setState({ lineChartData: newChartData });   

    }
  }

  componentWillUnmount() {
    // this.ws.close();
    // clearInterval(this.interval);
  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes["chart-container"]}>
      <Line
        data={this.state.lineChartData}
        options={this.state.lineChartOptions}
      />

      </div>
    );
  }
}

export default withStyles(styles, { withTheme: true })(AccelerationChart);
