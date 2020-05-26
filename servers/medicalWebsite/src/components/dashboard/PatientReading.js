import React from 'react'
import Card from '@material-ui/core/Card';
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import {withStyles} from "@material-ui/core/styles";
import moment from "moment";

const styles2 = {
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


    render() {
        const {classes} = this.props
        const tLatest = moment(this.props.patient.timestamp)
        const tCur = moment()

        let spo2_state = 0
        let hr_state = 0
        if (this.props.patient["heart_rate"] < 121 && this.props.patient["heart_rate"] > 69) {
            hr_state = 1
        }
        if (this.props.patient["spo2"] > 94 && this.props.patient["spo2"] < 100) {
            spo2_state = 1
        }

        let status
        if (!tLatest.isSame(tCur, 'day')){
            status = classes.inactive
        } else if (hr_state & spo2_state ){
            status = classes.normal
        } else if (hr_state ^ spo2_state) {
            status = classes.warning
        } else {
            status = classes.error
        }

        return (
            <Card className={`${classes.card} ${status}`}>
                <CardContent>
                    <Typography gutterBottom variant="h5" component="h2" color={'inherit'}>
                        <strong>{this.props.patient["id"]}</strong>
                    </Typography>
                    <Typography gutterBottom variant="h6" component="p" color={'inherit'}>
                        HR: <strong>{this.props.patient["heart_rate"]}</strong>
                    </Typography>
                    <Typography variant="h6" component="p" color={'inherit'}>
                        SpO2: <strong>{this.props.patient["spo2"]}</strong>
                    </Typography>
                </CardContent>
            </Card>
        );
    }
}


export default withStyles(styles2)(PatientReading)