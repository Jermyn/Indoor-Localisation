import React from 'react';
import moment from "moment";
import {withStyles} from "@material-ui/core/styles";
import 'hammerjs';
import {Charts, ChartContainer, ChartRow, EventMarker, YAxis, LineChart, Resizable, ScatterChart} from "react-timeseries-charts";
import {TimeSeries, TimeRange} from "pondjs";

const styles = theme => ({
    "chart-container": {
        height: 400
    }
});

class PlaybackChart extends React.Component {

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

            elements: {},
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
        if (this.props.vitals !== prevProps.vitals && this.props.vitals != null && this.props.vitals.length != 0) {
            let vitals = this.props.vitals

            const oldBtcDataSet = this.state.lineChartData.datasets[0];

            let chartpoints = []
            let chartpointAvg = []
            let dataset = this.state.chartData
            let labels = []
            let newDataSet = {...dataset}
            const newBtcDataSet = {...oldBtcDataSet};

            vitals.map((vital) => {
                let value
                if (this.props.data_type == 'Heart Rate'){
                    value = vital._source.heart_rate
                } else if (this.props.data_type == 'spO2') {
                    value = vital._source.spo2
                }
                let epoch = new Date(vital._source["@timestamp"]).toLocaleString('en-GB');
                let vitalSign = value
                let time = new Date(vital._source["@timestamp"]).setMinutes(0, 0, 0)
                // rounding to gmt+8, 6h mark
                let time2 = Math.round((time + 28800000)/21600000 ) * 21600000 - 28800000
                let point = [time2, value]
                chartpoints.push(point)
                labels.push(epoch)
                newBtcDataSet.data.push(vitalSign);
            })

            let tmp ={};
            chartpoints.forEach((date) => {
                let obj =  tmp[date[0]] = tmp[date[0]] || {count:0, total: 0};
                obj.count ++;
                obj.total += date[1]
            });

            Object.entries(tmp).map((a) =>{
                chartpointAvg.push([parseFloat(a[0]), a[1].total/a[1].count])
            })

            newDataSet.points = chartpointAvg;

            const newChartData = {
                ...this.state.lineChartData,
                datasets: [newBtcDataSet],
                labels: labels
            };

            this.setState({lineChartData: newChartData});
            this.setState({chartData: newDataSet})

            let timerange = new TimeRange([this.props.start, this.props.end]);
            this.setState({timerange})
        }

    }

    handleTimeRangeChange = timerange => {
        this.setState({timerange});
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
            this.setState({tracker: eventTime, trackerValue: v, trackerEvent: e});
        } else {
            this.setState({tracker: null, trackerValue: null, trackerEvent: null});
        }
    };

    render() {
        let timerange = ""
        let timeseries = ""
        if (this.state.chartData.points != null) {
            timeseries = new TimeSeries(this.state.chartData);
            timerange = this.state.timerange;
        }
        const style = {
            value: {
                normal: {stroke: "steelblue", strokeWidth: 5},
                highlighted: {stroke: "#5a98cb", fill: "none", strokeWidth: 2},
                selected: {stroke: "steelblue", fill: "none", strokeWidth: 2},
                muted: {stroke: "steelblue", fill: "none", opacity: 0.4, strokeWidth: 2}
            },

        };
        if (this.state.chartData.points != null) {
            return (
                <div>
                    <Resizable>
                        <ChartContainer
                            // enablePanZoom={true}
                            // onTrackerChanged={this.handleTrackerChanged}
                            // onTimeRangeChanged={this.handleTimeRangeChange}
                            timeRange={timerange} width={800}>
                            <ChartRow height="400">
                                <YAxis id="axis1" label={this.props.data_type} min={timeseries.min()} max={timeseries.max()}
                                       width="60" type="linear"/>
                                <Charts>
                                    {/*<LineChart axis="axis1" series={timeseries} style={style}/>*/}
                                    <ScatterChart axis="axis1" series={timeseries} style={style}/>
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

export default withStyles(styles, {withTheme: true})(PlaybackChart);
