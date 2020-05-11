import React from 'react'
import Card from '@material-ui/core/Card';
import CardContent from "@material-ui/core/CardContent";
import Typography from "@material-ui/core/Typography";
import {withStyles} from "@material-ui/core/styles";

const styles2 = {
    card: {
        maxWidth: 150,
        maxHeight: 200,
    },
    normal: {
        backgroundColor: "#43a047",
        color: "#FFF",
    },
    warning: {
        backgroundColor: "#fb8c00",
        color: "#FFF",
    },
    error: {
        backgroundColor: "#e53935",
        color: "#FFF",
    },
    circle: {
        width: 50,
        height: 50,
        borderRadius: 50,
        // font-size: 3em,
        // color: #fff;
        // line-height: 500px;
        textAlign: 'center',
        background: "#ffffff",
    },
    header:{
        fontsize: "14px",
    }
};


class PatientReading extends React.Component {


    render() {
        const {classes} = this.props;

        const status = (this.props.patients["heart_rate"] < 180 && this.props.patients["heart_rate"] > 20) ? classes.normal :
            (this.props.patients["heart_rate"] < 190 && this.props.patients["heart_rate"] > 10) ? classes.warning : classes.error

        return (
            <Card className={`${classes.card} ${status}`}>
                <CardContent>
                    <Typography gutterBottom variant="h5" component="h2" color={'inherit'}>
                        <strong>{this.props.patients["id"]}</strong>
                    </Typography>
                    <Typography gutterBottom variant="h6" component="p" color={'inherit'}>
                        HR: <strong >{this.props.patients["heart_rate"]}</strong>
                    </Typography>
                    <Typography variant="h6" component="p" color={'inherit'}>
                        SpO2: <strong>{this.props.patients["spo2"]}</strong>
                    </Typography>
                </CardContent>
            </Card>
        );
    }
}


export default withStyles(styles2)(PatientReading)