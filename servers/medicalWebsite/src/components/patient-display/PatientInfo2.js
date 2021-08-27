import React, {Component} from 'react';
import {connect} from "react-redux";

import AppBar from '@material-ui/core/AppBar';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Toolbar from '@material-ui/core/Toolbar';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import AccountCircle from '@material-ui/icons/AccountCircle';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import {withStyles} from '@material-ui/core/styles';

import TemporaryDrawer from '../../TemporaryDrawer';
import ConnectedPlaybackMode from './PlaybackMode';

import {
    addUsername,
    removeListenerSpecificEcgVitals,
    removeListenerSpecificHeartrateVitals,
    fetchHeartrateVitals,
    fetchEcgVitals,
    signOutUser,
    fetchSpecificHeartrateVitals,
    fetchSpecificEcgVitals
} from "../../actions/index";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Button from "@material-ui/core/Button";


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
        justify: "center",
        spacing: 0,
        alignItems: "center",
        style: "minHeight: '75vh'"
    },
    demoOne: {
        padding: '16px 32px 5px',
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
    },

});

const mapStateToProps = state => {
    return {
        beacon: state.beacon,
        info: state.info,
        isAuthenticating: state.isAuthenticating,
        authenticated: state.authenticated,
    };
};

const mapDispatchToProps = dispatch => {
    return {
        addUsername: username => dispatch(addUsername(username)),
        fetchEcgVitals: vitals => dispatch(fetchEcgVitals(vitals)),
        fetchHeartrateVitals: vitals => dispatch(fetchHeartrateVitals(vitals)),
        fetchSpecificHeartrateVitals: vitals => dispatch(fetchSpecificHeartrateVitals(vitals)),
        removeListenerSpecificHeartrateVitals: uuid => dispatch(removeListenerSpecificHeartrateVitals(uuid)),
        fetchSpecificEcgVitals: vitals => dispatch(fetchSpecificEcgVitals(vitals)),
        removeListenerSpecificEcgVitals: uuid => dispatch(removeListenerSpecificEcgVitals(uuid)),
        signOutUser: credentials => dispatch(signOutUser(credentials))
    };
};

class PatientInfo2 extends Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: false,
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
            chartMode: ['playback'],
            mapMode: ['live'],
            endpoint: "https://330f4015.ngrok.io",
            startTime: '2019-03-11T15:38:48.033972',
            endTime: '2019-03-11T15:38:49.271003',
            playbackRes: [],
            ecg: [],
            heartrate: [],
        };
    }

    componentDidMount() {
        this.setState({loading: true});

        if (this.props.info != "") {
            this.setState({name: this.props.info.name})
            this.setState({devices: this.props.info.devices})


            let devices = this.props.info.devices
            if (devices != null && devices[0] != "None") {
                devices.map((device) => {
                    // if (device.id.charAt(0) == 'e') {
                    //     this.props.fetchSpecificEcgVitals(device.uuid);
                    // }
                    //
                    // if (device.id.charAt(0) == 'h') {
                    //     this.props.fetchSpecificHeartrateVitals(device.uuid);
                    // }
                })
            }
        } else {
            this.props.history.push('/dashboard');
        }

    }

    componentWillUnmount() {
        let devices = this.props.info.devices
        if (devices != null && devices[0] != "None") {
            devices.map((device) => {
                if (device.id.charAt(0) == 'e') {
                    this.props.removeListenerSpecificEcgVitals(device.uuid);
                }

                if (device.id.charAt(0) == 'h') {
                    this.props.removeListenerSpecificHeartrateVitals(device.uuid);
                }
            })
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (this.props.ecg !== prevProps.ecg) {
            this.setState({ecg: this.props.ecg})
        }

        if (this.props.heartrate !== prevProps.heartrate) {
            this.setState({heartrate: this.props.heartrate})
        }

        if (this.props.isAuthenticating == false && this.props.authenticated == false) {
            this.props.history.push('/');
        }
    }

    toggleDrawer = () => {
        this.setState({drawer: true});
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

    handleSubmit = (e) => {
        e.preventDefault();
        this.props.history.push('/dashboard');
    }

    handleLoading = () => {
        this.setState(state => ({
            loading: !state.loading,
        }))
    }

    handleChange = prop => event => {
        this.setState({[prop]: event.target.value});
    };

    cancel = () => {
        this.props.history.push('/home');
    }

    handleLogOut = () => {
        this.handleClose()
        this.props.signOutUser()
    }

    goBack = (e) => {
        e.preventDefault();
        this.props.history.push('/dashboard');
    }

    render() {
        const {classes} = this.props;
        const {anchorEl, auth} = this.state;
        const open = Boolean(anchorEl)
        if (!this.props.info) {
            return <div></div>
        }
        return (
            <div className={classes.root}>
                <AppBar position="static" style={{boxShadow: "none", backgroundColor: "white"}}>
                    <Toolbar>
                        <IconButton className={classes.menuButton} color="inherit" aria-label="Menu"
                                    onClick={this.toggleDrawer}>
                            <MenuIcon/>
                        </IconButton>
                        <Typography variant="title" className={classes.grow} style={{color: "black"}}>
                            Status Tracking
                        </Typography>
                        {auth && (
                            <div>
                                <IconButton
                                    aria-owns={open ? 'menu-appbar' : null}
                                    aria-haspopup="true"
                                    onClick={this.handleMenu}
                                    color="inherit"
                                >
                                    <AccountCircle style={{color: "black"}}/>
                                </IconButton>
                                <Menu
                                    id="menu-appbar"
                                    anchorEl={anchorEl}
                                    anchorOrigin={{
                                        vertical: 'top',
                                        horizontal: 'right',
                                    }}
                                    transformOrigin={{
                                        vertical: 'top',
                                        horizontal: 'right',
                                    }}
                                    open={open}
                                    onClose={this.handleClose}
                                >
                                    <MenuItem onClick={this.handleLogOut}>Logout</MenuItem>
                                </Menu>
                            </div>
                        )}
                    </Toolbar>
                </AppBar>
                <Grid container justify="center">
                    <Grid container className={classes.demo}>
                        <Card className={classes.card}>
                            <CardContent>
                                <Grid container>
                                    <Grid item xs={3}>
                                        <Typography variant="h6" gutterBottom>Name: {this.props.info.name}</Typography>
                                    </Grid>
                                    <Grid item xs={3}>
                                        <Typography variant="h6" gutterBottom>{this.props.info.room.name}</Typography>
                                    </Grid>
                                    <Grid item xs={3}>
                                        <Typography variant="h6" gutterBottom>Bed {this.props.info.bed.id}</Typography>
                                    </Grid>
                                    <Grid item xs={12}> <ConnectedPlaybackMode/> </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                        <Button size="small" onClick={this.goBack} variant="contained" color="primary" style={{margin: '2em'}}>
                            Back
                        </Button>
                    </Grid>
                </Grid>

            </div>
        )
    }
}

const ConnectedPatientInfo2 = connect(mapStateToProps, mapDispatchToProps)(PatientInfo2);

export default withStyles(styles)(ConnectedPatientInfo2);