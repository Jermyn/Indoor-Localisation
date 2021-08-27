import React from 'react';
import moment from "moment";
import {withStyles} from "@material-ui/core/styles";
import 'hammerjs';
import {
    Charts,
    ChartContainer,
    ChartRow,
    YAxis,
    LineChart,
    Resizable,
    ScatterChart,
    Baseline,
    MultiBrush
} from "react-timeseries-charts";
import {TimeSeries, TimeRange} from "pondjs";

const styles = theme => ({
    "chart-container": {
        height: 400
    }
});

const DURATION_1H = 3600000
const DURATION_6H = 21600000
const DURATION_1D = 86400000

class PlaybackChart extends React.Component {

    state = {
        chartData: {
            name: "traffic",
            columns: ["time", "value"],
            points: []
        },
        timerange: "",
        emptyrange: [],
        tickCount: 0,
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
                if (this.props.data_type == 'heartrate') {
                    value = vital._source.heart_rate
                } else if (this.props.data_type == 'spo2') {
                    value = vital._source.spo2
                }
                let epoch = new Date(vital._source["@timestamp"]).toLocaleString('en-GB');
                let vitalSign = value
                let time = new Date(vital._source["@timestamp"]).setMinutes(0, 0, 0)
                // rounding to gmt+8, 6h mark, shift by 3
                let time2 = Math.round((time + DURATION_1H * (8 + 3)) / DURATION_6H) * DURATION_6H - DURATION_1H * (8 + 3)
                let point = [time2, value]
                chartpoints.push(point)
                labels.push(epoch)
                newBtcDataSet.data.push(vitalSign);
            })
            let tmp = {};
            chartpoints.forEach((date) => {
                let obj = tmp[date[0]] = tmp[date[0]] || {count: 0, total: 0};
                obj.count++;
                obj.total += date[1]
            });

            Object.entries(tmp).map((a) => {
                chartpointAvg.push([parseFloat(a[0]), a[1].total / a[1].count])
            })

            newDataSet.points = chartpointAvg;

            const newChartData = {
                ...this.state.lineChartData,
                datasets: [newBtcDataSet],
                labels: labels
            };

            this.setState({lineChartData: newChartData});
            this.setState({chartData: newDataSet})
        }

        if (this.props.start !== prevProps.start) {
            const emptyrange = []
            let start = this.props.start
            let end = this.props.end
            let t0 = this.props.start.valueOf()
            let timerange

            if (t0 === 0 && this.props.vitals && this.props.vitals[0]) {
                t0 = new Date(this.props.vitals[0]._source["@timestamp"]).setHours(0, 0, 0, 0)
                start = moment(t0)
                end = moment(new Date(this.props.vitals[this.props.vitals.length -1]._source["@timestamp"]).setHours(0, 0, 0, 0) + DURATION_1D)
            }

            timerange = new TimeRange([start, end + DURATION_6H]);

            if (end - start < DURATION_1D * 30) {
                Array.from(Array(30)).forEach((x, i) => {
                    emptyrange.push(new TimeRange(t0 + i * DURATION_1D, t0 + i * DURATION_1D + DURATION_6H))
                });
            }

            const tickCount = (timerange.duration() < DURATION_1D * 15) ?
                Math.floor((timerange.duration()) / DURATION_6H):
                Math.min(Math.ceil((timerange.duration()) / DURATION_1D), 30)

            this.setState({timerange})
            this.setState({emptyrange})
            this.setState({tickCount})
        }
    }

    render() {
        if (!this.state.timerange) {
            return <div></div>
        }
        const timeseries = new TimeSeries(this.state.chartData);
        const timerange = this.state.timerange;

        const style = {
            value: {
                normal: {stroke: "black", strokeWidth: 2},
            },

        };
        const stylePoint = {
            value: {
                normal: {stroke: "steelblue", strokeWidth: 5},
            },
        };

        return (
            <div>
                <Resizable>
                    <ChartContainer
                        showGrid={true}
                        timeRange={timerange} width={800}
                        // timeAxisTickCount={this.state.tickCount}
                    >
                        <ChartRow height="400">
                            <YAxis id="y"
                                   label={this.props.data_type == 'heartrate' ? 'Pulse Rate (bpm)' : 'Oxygen Saturation (%)'}
                                   min={this.props.data_type == 'heartrate' ? 50 : 80}
                                   max={this.props.data_type == 'heartrate' ? 160 : 100}
                                // min={this.props.data_type == 'heartrate' ? timeseries.min() - 20 : timeseries.min() - 10}
                                // max={this.props.data_type == 'heartrate' ? timeseries.max() + 20 : 100}
                                   width="60" type="linear"/>
                            <Charts>
                                <Baseline axis="y" position="right"
                                         value={this.props.data_type == 'heartrate' ? 110 : 95}/>
                                {/*<Baseline axis="y" label="Upper" position="right"*/}
                                {/*          value={this.props.data_type == 'heartrate' ? 90 : 200}/>*/}
                                <MultiBrush timeRanges={this.state.emptyrange}/>
                                <LineChart axis="y" series={timeseries} style={style}/>
                                <ScatterChart axis="y" series={timeseries} style={stylePoint}/>
                            </Charts>
                        </ChartRow>
                    </ChartContainer>
                </Resizable>
            </div>
        );

    }
}

export default withStyles(styles, {withTheme: true})(PlaybackChart);