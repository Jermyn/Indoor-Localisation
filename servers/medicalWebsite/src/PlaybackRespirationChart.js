import React from 'react';
import {Line} from 'react-chartjs-2';
import { withStyles } from "@material-ui/core/styles";
import 'hammerjs';
import * as pan from 'chartjs-plugin-zoom'
import { Charts, ChartContainer, ChartRow, EventMarker, YAxis, LineChart, Resizable } from "react-timeseries-charts";
import { TimeSeries, TimeRange, time } from "pondjs";
import moment from 'moment';
const styles = theme => ({
  "chart-container": {
    height: 400
  }
});

class PlaybackRespirationChart extends React.Component {

  state = {
    chartData: {
      name: "traffic",
      columns: ["time", "value"],
      points: null
    },
    timerange: "",
    tracker: null,
    trackerValue: "--",
    trackerEvent: null,

    lineChartData: {

      datasets: [
        {
          label: "BTC-USD",
          backgroundColor: "rgba(0, 0, 0, 0)",
          borderColor: this.props.theme.palette.primary.main,
          pointBackgroundColor: this.props.theme.palette.secondary.main,
          pointBorderColor: this.props.theme.palette.secondary.main,
          borderWidth: "2",
          lineTension: 0,
          data: []
        }
      ]
    },
    lineChartOptions: {


      legend: {
        display: false,
      },

      elements: {

      },
      tooltips: {
        enabled: true
      },
      // Container for pan options
	pan: {
    enabled: true,
  						mode: 'x',
			},

	// Container for zoom options
	zoom: {
    enabled: true,

  mode: 'x'
	}
    }
  };

  componentDidUpdate(prevProps, prevState) {

    if(this.props.vitals !== prevProps.vitals && this.props.vitals != null && this.props.vitals.length != 0 ) {
      let vitals = this.props.vitals

      const oldBtcDataSet = this.state.lineChartData.datasets[0];
      // let value = vitals[vitals.length - 1]

      let chartpoints = []
      let dataset = this.state.chartData

      let labels = []
      let newDataSet = {...dataset}
      const newBtcDataSet = { ...oldBtcDataSet };

      let timeString = "";
      let checkLog = []
      vitals.map((vital) => {
        let value = vital._source.resPoint
        let epoch = new Date(vital._source.timestamp).toLocaleString('en-GB');
        let vitalSign = value
        let time = new Date(vital._source.timestamp)
        let point = [time, value]
        chartpoints.push(point)
        labels.push(epoch)
        timeString += `${vital._source.timestamp} ,`
        checkLog.push(moment(vital._source.timestamp))
        newBtcDataSet.data.push(vitalSign);
      })
      newDataSet.points =  chartpoints

      let differenceString = ""
      let difference = checkLog.map((value, index, array) => {
        if(array[index+1] != null) {
          let minus = array[index+1] - value
          differenceString += `${minus},`
        }
      })


      const newLineData = {
        newDataSet
      }

      const newChartData = {
        ...this.state.lineChartData,
        datasets: [newBtcDataSet],
        labels: labels
      };


      this.setState({ lineChartData: newChartData });
      this.setState({chartData: newDataSet})

      const timeseries = new TimeSeries(newDataSet);
      var timerange = timeseries.timerange()
      this.setState({timerange})
    }

  }

  handleTimeRangeChange = timerange => {
        this.setState({ timerange });
    };

    handleTrackerChanged = t => {
        if (t) {
            let dataSet = new TimeSeries(this.state.chartData)
            const e = dataSet.atTime(t);
            const eventTime = new Date(
                e.begin().getTime() + (e.end().getTime() - e.begin().getTime()) / 2
            );
            const eventValue = e.get("value");
            const v = `${eventValue}`;
            this.setState({ tracker: eventTime, trackerValue: v, trackerEvent: e });
        } else {
            this.setState({ tracker: null, trackerValue: null, trackerEvent: null });
        }
    };

    renderMarker = () => {
        if (!this.state.tracker) {
            return <g />;
        }


        return (
          <EventMarker
                  type="point"
                  axis="axis1"
                  event={this.state.trackerEvent}
                  column="value"
                  markerLabel={this.state.trackerValue}
                  markerLabelAlign="left"
                  markerLabelStyle={{ fill: "black"}}
                  markerRadius={3}
                  markerStyle={{ fill: "black" }}
              />
            );

    };

  render() {

    let timerange = ""
    let timeseries = ""
    if(this.state.chartData.points != null ) {
      timeseries = new TimeSeries(this.state.chartData);
      timerange = this.state.timerange;
      }
        const style = {
          value: {
              normal: {stroke: "steelblue", fill: "none", strokeWidth: 2},
              highlighted: {stroke: "#5a98cb", fill: "none", strokeWidth: 2},
              selected: {stroke: "steelblue", fill: "none", strokeWidth: 2},
              muted: {stroke: "steelblue", fill: "none", opacity: 0.4, strokeWidth: 2}
          },

        };
 if(this.state.chartData.points != null ) {
    return (
      <div>

        {/*<Line data={this.state.lineChartData} options ={this.state.lineChartOptions} />*/}
        <Resizable>
        <ChartContainer
        enablePanZoom={true}
        onTrackerChanged={this.handleTrackerChanged}
        onTimeRangeChanged={this.handleTimeRangeChange}
        timeRange={timerange} width={800}>
          <ChartRow height="400">
              <YAxis id="axis1" label="Respiration" min={timeseries.min()} max={timeseries.max()} width="60" type="linear"/>
              <Charts>
                  <LineChart axis="axis1" series={timeseries} style={style}/>
                  {/*this.renderMarker()*/}
              </Charts>
          </ChartRow>
      </ChartContainer>
      </Resizable>
      </div>
    );
  } else {
    return null
  }

  }
}
export default withStyles(styles, { withTheme: true })(PlaybackRespirationChart);
