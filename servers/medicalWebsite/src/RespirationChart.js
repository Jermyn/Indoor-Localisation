import React from "react";
import { render } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
// import Chart from "./Chart";
import 'chartjs-plugin-streaming';
import { Line } from 'react-chartjs-2';

const styles = theme => ({
  "chart-container": {
    height: 400
  }
});

class RespirationChart extends React.Component {
  state = {
    lineChartData: {

      datasets: [
        {
          label: "BTC-USD",
          backgroundColor: "rgba(0, 0, 0, 0)",
          borderColor: this.props.theme.palette.primary.main,
          pointBackgroundColor: this.props.theme.palette.secondary.main,
          pointBorderColor: this.props.theme.palette.secondary.main,
          pointRadius: 0,
          borderWidth: "2",
          lineTension: 0,
          data: []
        }
      ]
    },
    lineChartOptions: {
      events: [],
      responsive: true,
      maintainAspectRatio: false,

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
              delay: 1000,
              pause: false,

            },
            ticks: {
              autoSkip: false,
              maxTicksLimit: 10
            }
          }
        ]
      }
    }
  };


  componentDidUpdate(prevProps, prevState) {
    if(this.props.vitals !== prevProps.vitals && this.props.vitals != null ) {
      let vitals = this.props.vitals

      const oldBtcDataSet = this.state.lineChartData.datasets[0];
      const newBtcDataSet = { ...oldBtcDataSet };
      vitals.map(vital => {
        let value = vital.resPoint
        let epoch = vital.timestamp;
        let date = new Date(epoch)
        let vitalSign = {x: epoch, y: value}
        newBtcDataSet.data.push(vitalSign);
      })



      const newChartData = {
        ...this.state.lineChartData,
        datasets: [newBtcDataSet],

      };

      this.setState({ lineChartData: newChartData });

    }

  }

  componentWillUnmount() {
    // this.ws.close();
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

export default withStyles(styles, { withTheme: true })(RespirationChart);
