import React, {Component} from 'react';
import AppBar from '@material-ui/core/AppBar';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import {green, red} from '@material-ui/core/colors';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import CheckIcon from '@material-ui/icons/Check';
import ErrorOutlineOutlinedIcon from '@material-ui/icons/ErrorOutlineOutlined';
import Toolbar from '@material-ui/core/Toolbar';
import {withStyles} from '@material-ui/core/styles';
import {connect} from "react-redux";
import {addUsername, fetchEcgVitals, fetchHeartrateVitals} from "./actions/index";
import Card from '@material-ui/core/Card';
import CardMedia from '@material-ui/core/CardMedia';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import CircularProgress from '@material-ui/core/CircularProgress';
import TemporaryDrawer from './TemporaryDrawer';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import AddIcon from '@material-ui/icons/Add';
import AccountCircle from '@material-ui/icons/AccountCircle';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import classNames from 'classnames';
import InputAdornment from '@material-ui/core/InputAdornment';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormLabel from '@material-ui/core/FormLabel';
import BeaconTable from './BeaconTable';
import CameraIcon from '@material-ui/icons/PhotoCamera';
import DeleteIcon from '@material-ui/icons/Delete';
import Chip from '@material-ui/core/Chip';
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import HealthChart from "./HealthChart";
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import socketIOClient from "socket.io-client";
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import axios from 'axios'
import PlaybackChart from './PlaybackChart'
import PlaybackEcgChart from './PlaybackEcgChart'
import PlaybackRespirationChart from './PlaybackRespirationChart'
import moment from 'moment';
import timeseries from 'pondjs/lib/lib/timeseries';


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
        addUsername: username => dispatch(addUsername(username)),
        fetchEcgVitals: vitals => dispatch(fetchEcgVitals(vitals)),
        fetchHeartrateVitals: vitals => dispatch(fetchHeartrateVitals(vitals)),
    };
};

let id = 0;

function createData(name, calories, fat, carbs, protein) {
    id += 1;
    return {id, name, calories, fat, carbs, protein};
}


class PlaybackMode extends Component {
    constructor(props) {
        super(props);

        this.state = {
            submittedForm: false,
            values: {},
            anchorEl: null,
            auth: true,
            name: "Santa Claus",
            owner: "",
            image: "",
            imagePreview: "",
            imageName: "",
            ward: "",
            contactDistance: "",
            tab: 0,
            beacon: this.props.beacon,
            response: [],
            chartMode: ['live'],
            endpoint: "https://330f4015.ngrok.io",
            startTime: moment(Date.now() - 259200000).format("YYYY-MM-DDThh:mm"),
            endTime: moment().format("YYYY-MM-DDThh:mm"),
            ecg: [],
            heartrate: [],
            devices: [],
            loading: false,
            success: false,
            error: "",
            errorButton: "",
            expanded: false,
        };
    }

    componentDidMount() {
        if (this.props.info != "")
            this.setState({name: this.props.info.name})
        this.setState({
            devices: this.props.info.devices.map(function (x) {
                return x.id
            })
        }, () => {
            this.submitForm()
        });


    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.vitals !== prevProps.vitals) {
            this.setState({vitals: this.props.vitals})
        }
    }

    toggleDrawer = () => {
        this.setState({drawer: true});
    }

    handleFormat = (event, chartMode) => {
        if (chartMode != this.state.chartMode && chartMode != null)
            this.setState({chartMode});
    }
    toggleCloseDrawer = () => {
        this.setState({drawer: false});
    }

    handleMenu = event => {
        this.setState({drawer: false});
        this.setState({anchorEl: event.currentTarget});
    };

    handleClose = () => {
        this.setState({anchorEl: null});
    };

    backToMap = (e) => {
        e.preventDefault();
        this.props.history.push('/locationTracking');
    }

    handleSubmit = (e) => {
        e.preventDefault();
        this.props.history.push('/home');

    }

    handleLoading = () => {
        this.setState(state => ({
            loading: !state.loading,
        }))
    }

    handleChange = prop => event => {
        this.setState({[prop]: event.target.value});
    };

    handleTabChange = (event, value) => {
        this.setState({tab: value});
    };

    imageUpload = (e) => {
        if (e.target.files[0]) {
            const image = e.target.files[0];
            this.setState({image})
            this.setState({imagePreview: URL.createObjectURL(e.target.files[0])})
            this.setState({imageName: image.name})
        }
    }

    removeImage = () => {
        this.setState({image: ""});
        this.setState({imagePreview: ""});
        this.setState({imageName: ""});
    }

    updateStart = (e) => {
        this.setState({startTime: e.target.value})
    }

    updateEnd = (e) => {
        this.setState({endTime: e.target.value})
    }

    cancel = () => {
        this.props.history.push('/home');
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

        axios.get(`/vitals/_search?scroll=1m`, {
            params: {
                source: JSON.stringify(query),
                source_content_type: 'application/json'
            }
        }).then((res) => {
            // console.log (res)
            let fullTrace = res.data.hits.hits
            let fullShot = []
            let counter = 0
            fullShot = fullShot.concat(fullTrace)

            let scroll_size = res.data.hits.total

            let scroll_id = res.data._scroll_id

            let scrollQuery = {
                "scroll": "1m",
                "scroll_id": scroll_id
            }

            if (index == "ecg")
                this.getAPI(scrollQuery, fullShot, index, devices)
            if (index == "heartrate")
                this.getAPI(scrollQuery, fullShot, index, devices)

        });
    }

    getAPI = (scrollQuery, fullShot, index, devices) => {
        axios.get(`/_search/scroll`, {
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
            this.submitQuery('heartrate', this.state.devices);
            this.setState({error: ""})
        } else {
            this.setState({error: 'Time range is invalid'})
        }

    }

    renderPlaybackForm = (loading, success, errorButton) => {
        const {classes} = this.props;
        let currentTime = moment().format();
        let timeSplit = currentTime.split('T')
        let timeString = timeSplit[0] + 'T' + timeSplit[1].slice(0, 5)
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
        const {anchorEl, auth} = this.state;
        const {loading, success, errorButton, expanded} = this.state;
        const open = Boolean(anchorEl)
        return (
            <div className={classes.root}>
                {this.renderPlaybackForm(loading, success, errorButton)}
                <div><Typography variant="subtitle1" style={{color: 'red'}}> {this.state.error}  </Typography></div>
                <ExpansionPanel expanded={expanded}>
                    <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>
                        <Typography variant="subtitle1" gutterBottom>Heart Rate</Typography>
                    </ExpansionPanelSummary>
                    <ExpansionPanelDetails>
                        <div style={{width: '100%'}}>
                            <PlaybackChart vitals={this.state.heartrate}/>
                        </div>
                    </ExpansionPanelDetails>
                </ExpansionPanel>

                {/* <ExpansionPanel>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" gutterBottom >ECG</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <div style={{width: '100%'}}>
              <PlaybackEcgChart vitals={this.state.ecg} />
            </div>
          </ExpansionPanelDetails>
        </ExpansionPanel>

        <ExpansionPanel>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1" gutterBottom >Respiration</Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>
            <div style={{width: '100%'}}>
              <PlaybackRespirationChart vitals={this.state.ecg} />
            </div>
          </ExpansionPanelDetails>
        </ExpansionPanel> */}
            </div>
        )
    }
}

const ConnectedPlaybackMode = connect(mapStateToProps, mapDispatchToProps)(PlaybackMode);

export default withStyles(styles)(ConnectedPlaybackMode);
