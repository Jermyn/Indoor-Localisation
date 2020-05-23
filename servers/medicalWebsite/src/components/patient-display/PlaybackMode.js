import React, {Component} from 'react';
import axios from 'axios'
import moment from 'moment';
import classNames from 'classnames';
import {connect} from "react-redux";

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import {green, red} from '@material-ui/core/colors';
import Typography from '@material-ui/core/Typography';
import CheckIcon from '@material-ui/icons/Check';
import ErrorOutlineOutlinedIcon from '@material-ui/icons/ErrorOutlineOutlined';
import {withStyles} from '@material-ui/core/styles';
import CircularProgress from '@material-ui/core/CircularProgress';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import PlaybackChart from './PlaybackChart'

import {addUsername} from "../../actions/index";

const styles = theme => ({
    container: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    root: {
        flexGrow: 1,
    },
    grow: {
        flexGrow: 1,
    },
    card: {
        minWidth: 275,
        padding: '1.5rem',
        flexGrow: '1',
    },
    textField: {
        // marginLeft: theme.spacing.unit,
        // marginRight: theme.spacing.unit,
    },
    borderBox: {
        border: '1px solid',
        padding: '2rem',
        borderRadius: '16px',
    },
    menu: {
        width: 200,
    },
    menuButton: {
        marginLeft: -12,
        marginRight: 20,
        opacity: 0.4,
        color: 'black',
    },
    align: {
        padding: `${theme.spacing.unit * 2}px ${theme.spacing.unit * 3}px ${theme.spacing.unit * 3}px`,
    },
    label: {
        textTransform: 'capitalize',
    },
    cameraIcon: {
        opacity: '0.5',
        paddingLeft: '10px'
    },
    cardContent: {
        paddingBottom: '16px'
    },
    demo: {
        padding: '16px 32px 24px',
        // [theme.breakpoints.up("sm")]: {
        //   width: '560px'
        // }
    },
    demoOne: {
        padding: '16px 32px 5px',
        // [theme.breakpoints.up("sm")]: {
        //   width: '560px'
        // }
    },
    toggleContainer: {
        height: 56,
        padding: `${theme.spacing.unit}px ${theme.spacing.unit * 2}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        margin: `${theme.spacing.unit}px 0`,
    },
    button: {
        margin: theme.spacing.unit,
        backgroundColor: green[500],
        '&:hover': {
            backgroundColor: green[700],
        },
    },
    buttonProgress: {
        color: green[500],
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginTop: -12,
        marginLeft: -12,
    },
    buttonSuccess: {
        backgroundColor: green[500],
        '&:hover': {
            backgroundColor: green[700],
        },
    },
    buttonError: {
        backgroundColor: red[500],
        '&:hover': {
            backgroundColor: red[700],
        },
    },
    wrapper: {
        margin: theme.spacing.unit,
        position: 'relative',
    },
});

const mapStateToProps = state => {
    return {
        beacon: state.beacon,
        vitals: state.vitals,
        info: state.info,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        addUsername: username => dispatch(addUsername(username))
    };
};

class PlaybackMode extends Component {
    constructor(props) {
        super(props);

        this.state = {
            startTime: moment(Date.now() - 172800000).format("YYYY-MM-DDT00:00"),
            endTime: moment(Date.now() + 86400000).format("YYYY-MM-DDT00:00"),
            ecg: [],
            vitals: [],
            submittedForm: false,
            values: {},
            beacon: this.props.beacon,
            devices: [],
            loading: false,
            success: false,
            error: "",
            errorButton: "",
            expanded: false,
        };
    }

    componentDidMount() {
        if (this.props.info != ""){
            this.setState({
                devices: this.props.info.devices.map(function (x) {
                    return x.id
                })
            }, () => {
                this.submitForm()
            });
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.vitals !== prevProps.vitals) {
            this.setState({vitals: this.props.vitals})
        }
    }

    handleLoading = () => {
        this.setState(state => ({
            loading: !state.loading,
        }))
    }

    handleChange = prop => event => {
        this.setState({[prop]: event.target.value});
    };

    updateStart = (e) => {
        this.setState({startTime: e.target.value})
    }

    updateEnd = (e) => {
        this.setState({endTime: e.target.value})
    }

    submitQuery = (index, devices) => {
        let timeStart = this.state.startTime
        let timeEnd = this.state.endTime
        timeStart = timeStart + ':00'
        timeEnd = timeEnd + ':00'
        const query = {
            "size": 10000,
            "sort": [{"@timestamp": {"order": "asc"}}],
            "query": {
                "bool": {
                    "must": [
                        {
                            "term": {
                                "gattid": `${devices}`
                            }
                        },
                        {
                            "range": {
                                "@timestamp": {
                                    "gte": timeStart,
                                    "lte": timeEnd,
                                    "time_zone": "+08:00"
                                }
                            }
                        }
                    ]
                }
            }
        };

        axios.get(`http://137.132.165.139:9200/zmq/vitals/_search?scroll=1m`, {
            params: {
                source: JSON.stringify(query),
                source_content_type: 'application/json'
            }
        }).then((res) => {
            let fullTrace = res.data.hits.hits
            let fullShot = []
            fullShot = fullShot.concat(fullTrace)

            let scroll_id = res.data._scroll_id
            let scrollQuery = {
                "scroll": "1m",
                "scroll_id": scroll_id
            }
            this.getAPI(scrollQuery, fullShot, index, devices)
        });
    }

    getAPI = (scrollQuery, fullShot, index, devices) => {
        axios.get(`http://137.132.165.139:9200/_search/scroll`, {
            params: {
                source: JSON.stringify(scrollQuery),
                source_content_type: 'application/json'
            }
        }).then((res) => {
            let fullTrace = res.data.hits.hits
            fullShot = fullShot.concat(fullTrace)
            let scroll_id = res.data._scroll_id
            let scrollQuery = {
                'scroll': '1m',
                'scroll_id': scroll_id
            }
            let scroll_size = res.data.hits.hits.length
            console.log(fullShot)
            if (scroll_size > 0) {
                this.getAPI(scrollQuery, fullShot, index, devices)
            } else {
                if (fullShot.length > 0) {
                    this.setState({[index]: fullShot})
                    this.setState({success: true})
                    this.setState({loading: false})
                    this.setState({expanded: true})
                } else {
                    this.setState({loading: false})
                    this.setState({errorButton: "There is no data for " + `${devices}` + ". Please change patient or device."})
                }
            }
        })
    }

    submitForm = () => {
        let unixStart = new Date(this.state.startTime)
        let unixEnd = new Date(this.state.endTime)
        if (!this.state.loading) {
            this.setState(
                {
                    success: false,
                    loading: true,
                })
        }
        if (unixStart <= unixEnd) {
            // this.submitQuery('ecg');
            this.submitQuery('vitals', this.state.devices);
            this.setState({error: ""})
        } else {
            this.setState({error: 'Time range is invalid'})
        }

    }

    renderPlaybackForm = (loading, success, errorButton) => {
        const {classes} = this.props;
        const buttonClassname = classNames({
            [classes.button]: success,
            [classes.buttonError]: errorButton
        });
        let form = <div>
            <form className={classes.container} noValidate>

                <TextField
                    id="datetime-local"
                    label="Start"
                    variant="outlined"
                    type="datetime-local"
                    style={{marginRight: '1em', marginBottom: '1em'}}
                    defaultValue={this.state.startTime}
                    className={classes.textField}
                    onChange={this.updateStart}
                    error={this.state.error == "" ? false : true}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />

                <TextField
                    id="datetime-local"
                    label="End"
                    variant="outlined"
                    type="datetime-local"
                    defaultValue={this.state.endTime}
                    className={classes.textField}
                    onChange={this.updateEnd}
                    error={this.state.error == "" ? false : true}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
                <div className={classes.wrapper}>
                    <Button variant="contained" color="primary" onClick={this.submitForm} className={buttonClassname}>
                        {success ? <CheckIcon/> : errorButton ? <ErrorOutlineOutlinedIcon/> : "Fetch"}
                        {/* {error ? <ErrorOutlineOutlinedIcon /> : "Fetch"} */}
                    </Button>
                    {loading && <CircularProgress size={24} className={classes.buttonProgress}/>}
                </div>
                {errorButton ?
                    <div>
                        <Typography variant="subtitle1" style={{color: 'red'}}>
                            {errorButton}
                        </Typography>
                    </div> : ""}
            </form>
        </div>

        return form
    }

    render() {
        const {classes} = this.props;
        const {loading, success, errorButton, expanded} = this.state;
        return (
            <div className={classes.root}>
                {/*{this.renderPlaybackForm(loading, success, errorButton)}*/}
                {/*<div><Typography variant="subtitle1" style={{color: 'red'}}> {this.state.error}  </Typography></div>*/}
                <ExpansionPanel expanded={expanded}>
                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                        <Typography variant="subtitle1" gutterBottom>Heart Rate</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <div style={{width: '100%'}}>
                            <PlaybackChart vitals={this.state.vitals} data_type = 'Heart Rate' start={moment(this.state.startTime,'YYYY-MM-DDThh:mm' )} end={moment(this.state.endTime,'YYYY-MM-DDThh:mm' )}/>
                        </div>
                    </ExpansionPanelDetails>
                </ExpansionPanel>
                <ExpansionPanel expanded={expanded}>
                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                        <Typography variant="subtitle1" gutterBottom>SPO2</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <div style={{width: '100%'}}>
                            <PlaybackChart vitals={this.state.vitals} data_type = 'spO2' start={moment(this.state.startTime,'YYYY-MM-DDThh:mm' )} end={moment(this.state.endTime,'YYYY-MM-DDThh:mm' )}/>
                        </div>
                    </ExpansionPanelDetails>
                </ExpansionPanel>

            </div>
        )
    }
}

const ConnectedPlaybackMode = connect(mapStateToProps, mapDispatchToProps)(PlaybackMode);

export default withStyles(styles)(ConnectedPlaybackMode);
