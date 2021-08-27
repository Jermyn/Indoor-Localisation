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
            status: null,
            displayCur:false,
            // hr: 0,
            // spo2: 0,
        };
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props && prevProps !== this.props) {
            const hr = this.props.patient.heart_rate
            const spo2 = this.props.patient.spo2
            const displayCur = this.props.patient.period

            if (hr !== this.state.hr || spo2 !== this.state.spo2 || displayCur !== this.state.displayCur) {
                let status, hr_state, spo2_state

                hr_state = hr <= 110 ? 1 : 0
                spo2_state = (spo2 > 95 && spo2 < 100) ? 1 : 0

                if (!displayCur) {
                    status = this.props.classes.inactive
                } else if (hr_state & spo2_state) {
                    status = this.props.classes.normal
                } else if (hr_state ^ spo2_state) {
                    status = this.props.classes.warning
                } else {
                    status = this.props.classes.error
                }
                this.setState({status, displayCur})
            }

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
                        PR: <strong>{this.props.patient.heart_rate}</strong>
                    </Typography>
                    <Typography variant="h6" component="p" color={'inherit'}>
                        SpO2: <strong>{this.props.patient.spo2}</strong>
                    </Typography>
                </CardContent>
            </Card>
        );
    }
}


export default withStyles(styles)(PatientReading)