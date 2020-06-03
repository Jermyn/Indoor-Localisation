import React from 'react'
import moment from "moment";

import Card from '@material-ui/core/Card';
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import {withStyles} from "@material-ui/core/styles";


const styles = {
    card: {
        maxWidth: 150,
        maxHeight: 200,
        color: "#ffffff",
    },
    normal: {
        backgroundColor: "#43a047",
    },
    warning: {
        backgroundColor: "#fb8c00",
    },
    error: {
        backgroundColor: "#e53935",
    },
    inactive: {
        backgroundColor: "#777777",
    },
};


class PatientReading extends React.Component {

    constructor() {
        super();
        this.state = {
            hr_state: 0,
            spo2_state: 0,
            status: null,
            tCur: moment()
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props && prevProps !== this.props) {
            let tCur = this.state.tCur
            let hr_state = this.state.hr_state
            let spo2_state = this.state.spo2_state
            let status

            if (this.props.curCp && this.props.curCp !== prevProps.curCp) {
                tCur = moment().set({hour: this.props.curCp, minute: 0, second: 0, millisecond: 0})
                if (moment().hours() < this.props.checkpoints[0]) {
                    tCur = tCur.subtract(1, 'days')
                }
                this.setState({tCur})
            }

            if (this.props.patient && this.props.patient !== prevProps.patient) {
                if (this.props.patient["heart_rate"] <= 90) {
                    hr_state = 1
                }
                if (this.props.patient["spo2"] > 94 && this.props.patient["spo2"] < 100) {
                    spo2_state = 1
                }
                this.setState({hr_state, spo2_state})
            }

            const tLatest = moment(this.props.patient.timestamp)
            if (tLatest.isBefore(this.state.tCur)) {
                status = this.props.classes.inactive
            } else if (hr_state & spo2_state) {
                status = this.props.classes.normal
            } else if (hr_state ^ spo2_state) {
                status = this.props.classes.warning
            } else {
                status = this.props.classes.error
            }
            this.setState({status})
        }

    }

    render() {
        return (
            <Card className={`${this.props.classes.card} ${this.state.status}`}>
                <CardContent>
                    <Typography gutterBottom variant="h5" component="h2" color={'inherit'}>
                        <strong>{this.props.patient.name}</strong>
                    </Typography>
                    <Typography gutterBottom variant="h6" component="p" color={'inherit'}>
                        HR: <strong>{this.props.patient.heart_rate}</strong> ({this.props.patient.heart_rate_prev})
                    </Typography>
                    <Typography variant="h6" component="p" color={'inherit'}>
                        SpO2: <strong>{this.props.patient.spo2}</strong> ({this.props.patient.spo2_prev})
                    </Typography>
                </CardContent>
            </Card>
        );
    }
}


export default withStyles(styles)(PatientReading)