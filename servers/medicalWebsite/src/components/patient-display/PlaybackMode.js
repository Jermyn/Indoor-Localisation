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
import Grid from "@material-ui/core/Grid";

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

const DURATION_1D = 86400000

class PlaybackMode extends Component {
    constructor(props) {
        super(props);

        this.state = {
            startTime: moment(Date.now() - DURATION_1D * 2).format("YYYY-MM-DDT00:00"),
            endTime: moment(Date.now() + DURATION_1D).format("YYYY-MM-DDT00:00"),
            showAll: false,
            vital: [],
            submittedForm: false,
            values: {},
            beacon: this.props.beacon,
            devices: [],
            loading: false,
            error: "",
            errorButton: "",
        };
    }

    componentDidMount() {
        if (this.props.info != "") {
            this.setState({
                devices: this.props.info.devices.map(function (x) {
                    return x.uuid
                })
            }, () => {
                this.fetchData()
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
                            "exists": {
                                "field": "spo2"
                            }
                        },
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

        fetch(`http://52.77.184.100:9200/vitals/_search?scroll=1m`, {
            method: "POST",
            body: JSON.stringify(query),
            mode: 'cors',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
        }
        }).then(res => res.json())
        .then((data) => {
            let fullTrace = data.hits.hits
            let fullShot = []
            fullShot = fullShot.concat(fullTrace)

            let scroll_id = data._scroll_id
            let scrollQuery = {
                "scroll": "1m",
                "scroll_id": scroll_id
            }
            this.getAPI(scrollQuery, fullShot, index, devices)
        })
        .catch(error => {
            console.error(
                "There has been a problem with your fetch operation:",
                error
            );
        });
    }

    getAPI = (scrollQuery, fullShot, index, devices) => {
        fetch(`http://52.77.184.100:9200/_search/scroll`, {
            method: "POST",
            body: JSON.stringify(scrollQuery),
            mode: 'cors',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
        }
        }).then(res => res.json())
        .then((data) => {
            let fullTrace = data.hits.hits
            fullShot = fullShot.concat(fullTrace)
            let scroll_id = data._scroll_id
            let scrollQuery = {
                'scroll': '1m',
                'scroll_id': scroll_id
            }
            let scroll_size = data.hits.hits.length
            console.log('fullshot', fullShot)
            if (scroll_size > 0) {
                this.getAPI(scrollQuery, fullShot, index, devices)
            } else {
                if (fullShot.length > 0) {
                    this.setState({[index]: fullShot})
                    this.setState({loading: false})
                } else {
                    this.setState({loading: false})
                }
            }
        })
    }

    submitForm = () => {
        this.submitQuery('vital', this.state.devices);
    }

    fetchData = () => {

        const time = this.state.showAll ? moment(0).format("YYYY-MM-DDThh:mm") : moment(Date.now() - DURATION_1D * 2).format("YYYY-MM-DDT00:00")

        this.setState({
            startTime: time
        }, () => {
            this.submitForm()
        })

        this.setState(prevState => ({
            showAll: !prevState.showAll
        }));

    }

    renderPlaybackForm = () => {
        const {classes} = this.props;

        let form = <div>
            <form className={classes.container} noValidate>
                <Button variant="contained" color="primary" onClick={this.fetchData}>
                    {this.state.showAll ? "Show All Days" : "Show 3 Days"}
                </Button>
            </form>
        </div>

        return form
    }

    render() {
        const {classes} = this.props;
        return (
            <div className={classes.root}>
                {this.renderPlaybackForm()}
                <div><Typography variant="subtitle1" style={{color: 'red'}}> {this.state.error}  </Typography></div>
                <ExpansionPanel defaultExpanded={true}>
                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                        <Typography variant="subtitle1" gutterBottom>Pulse Rate</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <div style={{width: '100%'}}>
                            <PlaybackChart vitals={this.state.vital} data_type='heartrate'
                                           start={moment(this.state.startTime, 'YYYY-MM-DDThh:mm')}
                                           end={moment(this.state.endTime, 'YYYY-MM-DDThh:mm')}/>
                        </div>
                    </ExpansionPanelDetails>
                </ExpansionPanel>
                <ExpansionPanel defaultExpanded={true}>
                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                        <Typography variant="subtitle1" gutterBottom>SpO2</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <div style={{width: '100%'}}>
                            <PlaybackChart vitals={this.state.vital} data_type='spo2'
                                           start={moment(this.state.startTime, 'YYYY-MM-DDThh:mm')}
                                           end={moment(this.state.endTime, 'YYYY-MM-DDThh:mm')}/>
                        </div>
                    </ExpansionPanelDetails>
                </ExpansionPanel>
            </div>
        )
    }
}

const ConnectedPlaybackMode = connect(mapStateToProps, mapDispatchToProps)(PlaybackMode);

export default withStyles(styles)(ConnectedPlaybackMode);