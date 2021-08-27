import React, {Component} from 'react';
import {connect} from "react-redux";
import moment from "moment";

import Grid from '@material-ui/core/Grid';
import AppBar from '@material-ui/core/AppBar';
import {withStyles} from "@material-ui/core/styles";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import Typography from "@material-ui/core/Typography";
import AccountCircle from "@material-ui/icons/AccountCircle";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import StopIcon from '@material-ui/icons/Stop';

import {
    signOutUser,
    verifyAuth,
    fetchRooms,
    readPatients,
    fetchDashboardPatients,
    loadInfo
} from "../../actions";
import PatientReading from "./PatientReading";
import Button from "@material-ui/core/Button";


const styles = {
    root: {
        flexGrow: 1,
    },
    grow: {
        flexGrow: 1,
    },
    menuButton: {
        marginLeft: -12,
        marginRight: 20,
        opacity: 0.4,
        color: 'black',
    },
    title: {
        paddingBottom: '.3em',
        paddingTop: '1em',
    },
    AppBar: {
        borderBottom: '1px solid #f2f3f3',
    },
    gridContainerMain: {
        padding: 100,
        paddingBottom: 40
    },
    gridContainerRoom: {
        padding: 20,
        border: '2px solid #000000',
    },
    gridItemLegend: {
        padding: 20,
        border: '2px solid #aaaaaa',
    },
    gridCard: {
        padding: 5
    },
    gridContainerButton: {
        padding: 50,
    }

};

const checkpoints = [8, 12, 16, 20]

const mapStateToProps = state => {
    return {
        username: state.username,
        authenticated: state.authenticated,
        isAuthenticating: state.isAuthenticating,
        rooms: state.rooms,
        patients: state.patients,
        patients_es: state.patients_es
    };
};

const mapDispatchToProps = dispatch => {
    return {
        signOutUser: username => dispatch(signOutUser(username)),
        verifyAuth: credentials => dispatch(verifyAuth(credentials)),
        fetchRooms: () => dispatch(fetchRooms()),
        readPatients: () => dispatch(readPatients()),
        fetchDashboardPatients: (tStart, tEnd) => dispatch(fetchDashboardPatients(tStart, tEnd)),
        loadInfo: object => dispatch(loadInfo(object))
    };
};

class PatientDashboard extends Component {

    constructor(props) {
        super(props);
        this.state = {
            username: this.props.username,
            anchorEl: null,
            auth: true,
            drawer: false,
            isAuthenticating: true,

            tPrev: moment(),
            tCur: moment(),
            tNext: moment(),
            periodCounter: 0,
        };
    }

    componentDidMount() {
        this.props.fetchRooms()
        this.props.readPatients()
        this.periodUpdate()
        this.timer = setInterval(() => this.periodUpdate(), 5000);
    }

    componentWillUnmount() {
        clearInterval(this.timer)
        this.timer = null;
    }

    componentDidUpdate(prevProps) {
        if (this.props.username !== prevProps.username) {
            this.setState({username: this.props.username})
        }
        if (this.props.isAuthenticating === false && this.props.authenticated === false) {
            this.props.history.push('/');
        }
    }

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve)
        });
    }

    async setupTime() {
        const t = moment()
        let timeNow = t.hours()
        // let tPrev = moment().set({date: 17, hour: 12, minute: 0, second: 0, millisecond: 0})
        // let tCur = moment().set({date: 17, hour: 13, minute: 0, second: 0, millisecond: 0})
        // let tNext = moment().set({date: 17, hour: 15, minute: 0, second: 0, millisecond: 0})
        // await this.setStateAsync({tPrev, tCur, tNext})
        const cpCur = timeNow >= checkpoints[0] ? Math.max.apply(Math, checkpoints.filter(x => x <= timeNow)) : checkpoints.slice(-1)[0]
        // const cpCur = 7
        if (cpCur !== this.state.cpCur) {
            const cpPrev = checkpoints[(checkpoints.indexOf(cpCur) - 1 + checkpoints.length) % checkpoints.length]
            const cpNext = checkpoints[(checkpoints.indexOf(cpCur) + 1) % checkpoints.length]

            let tPrev = moment().set({hour: cpPrev, minute: 0, second: 0, millisecond: 0})
            let tCur = moment().set({hour: cpCur, minute: 0, second: 0, millisecond: 0})
            let tNext = moment().set({hour: cpNext, minute: 0, second: 0, millisecond: 0})
            console.log(checkpoints.slice(-1)[0], cpPrev, cpNext, cpCur)
            if (timeNow < checkpoints[0]) {
                tCur.subtract(1, 'days')
                tPrev.subtract(1, 'days')
            }
            else if (cpPrev === checkpoints.slice(-1)[0]) {
                tPrev.subtract(1, 'days')
            } else if (cpNext === checkpoints[0]) {
                tNext.add(1, 'days')
                // tCur.subtract(1, 'days')
                // tPrev.subtract(1, 'days')
            }
            await this.setStateAsync({tPrev, tCur, tNext})
        }

    }

    async periodUpdate() {
        if (this.state.periodCounter === 0) {
            await this.setupTime()
            this.updatePatientsES()
        }
    }

    updatePatientsES() {
        let t1 = this.state.tCur.clone().subtract(15, 'minutes')
        let t2 = this.state.tNext.clone().subtract(15, 'minutes')
        // let t1 = this.state.tCur.clone()
        // let t2 = this.state.tNext.clone()
        if (this.state.tCur.hours() === checkpoints[0]) {
            t1.subtract(2, 'hours')
        }
        this.props.fetchDashboardPatients(t1, t2);
    }

    displaySinglePatient(id) {
        const patient = this.props.patients.find(patient => patient.devices[0].uuid === id)
        if (patient) {
            this.props.loadInfo(patient);
            this.props.history.push('/patientInfo2');
        } else {
            console.log('invalid patient')
        }
    }

    toggleDrawer = () => {
        this.setState({drawer: true});
    }

    toggleCloseDrawer = () => {
        this.setState({drawer: false});
    }

    handleChange = event => {
        this.setState({auth: event.target.checked});
    };

    handleMenu = event => {
        this.setState({drawer: false});
        this.setState({anchorEl: event.currentTarget});
    };

    handleClose = () => {
        this.setState({anchorEl: null});
    };

    handleLogOut = () => {
        this.setState({anchorEl: null});
        this.props.signOutUser()
    }

    async handlePeriodBtn(isNext) {

        if (isNext) {
            let tNext = this.state.tNext.clone()
            const cpNext = checkpoints[(checkpoints.indexOf(tNext.hours()) + 1) % checkpoints.length]
            tNext.set({hour: cpNext})
            if (cpNext === checkpoints[0]) {
                tNext.add(1, "days")
            }
            await this.setStateAsync(prevState => ({
                tPrev: prevState.tCur,
                tCur: prevState.tNext,
                tNext: tNext,
                periodCounter: prevState.periodCounter + 1
            }))
        } else {
            let tPrev = this.state.tPrev.clone()
            const cpPrev = checkpoints[(checkpoints.indexOf(tPrev.hours()) - 1 + checkpoints.length) % checkpoints.length]
            tPrev.set({hour: cpPrev})
            if (cpPrev === checkpoints.slice(-1)[0]) {
                tPrev = tPrev.subtract(1, 'days')
            }
            await this.setStateAsync(prevState => ({
                tPrev: tPrev,
                tCur: prevState.tPrev,
                tNext: prevState.tCur,
                periodCounter: prevState.periodCounter - 1
            }))
        }

        this.updatePatientsES();
    }

    renderAppBar() {
        const {classes} = this.props;
        const {anchorEl, auth} = this.state;
        const open = Boolean(anchorEl)

        return <AppBar position="static" style={{boxShadow: "none", backgroundColor: "white"}}
                       className={classes.AppBar}>
            <Toolbar>
                <IconButton className={classes.menuButton} color="inherit" aria-label="Menu"
                            onClick={this.toggleDrawer}>
                    <MenuIcon/>
                </IconButton>
                <Typography variant="title" className={classes.grow} style={{color: "black"}}>
                    Dashboard
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
        </AppBar>;
    }

    renderMiscGrid() {
        const {classes} = this.props;

        return <Grid container className={classes.gridContainerMain} justify="flex-start" alignItems='flex-start'>
            <Grid item xs={4}>
                <Grid item>
                    <Typography gutterBottom variant="h4" component="h4" color={'inherit'}>
                        <strong>Current Period: </strong>
                        {this.state.tCur.format('DD/MM HH:mm')} - {this.state.tNext.format('DD/MM HH:mm')}
                    </Typography>
                </Grid>
                <Button variant="contained" size={"large"} color="primary" onClick={() => this.handlePeriodBtn(false)}>
                    {"<<"}
                </Button>
                <Button variant="contained" size={"large"} color="primary" onClick={() => this.handlePeriodBtn(true)}>
                    {">>"}
                </Button>
            </Grid>
            <Grid item xs={4}/>
            <Grid item xs={4}>
                <Grid item className={classes.gridItemLegend}>
                    <Typography gutterBottom variant="h6" component="h2" color={'inherit'}>
                        <StopIcon style={{color: '#777777'}}/> Inactive reading
                    </Typography>
                    <Typography gutterBottom variant="h6" component="h2" color={'inherit'}>
                        <StopIcon style={{color: '#43a047'}}/> Normal Pulse Rate and SpO2
                    </Typography>
                    <Typography gutterBottom variant="h6" component="h2" color={'inherit'}>
                        <StopIcon style={{color: '#fb8c00'}}/> Abnormal Pulse Rate or SpO2
                    </Typography>
                    <Typography gutterBottom variant="h6" component="h2" color={'inherit'}>
                        <StopIcon style={{color: '#e53935'}}/> Abnormal Pulse Rate and SpO2
                    </Typography>
                </Grid>
            </Grid>
        </Grid>;
    }

    renderMainGrid() {
        const {classes} = this.props;

        if (!this.props.rooms || !this.props.patients_es || !this.props.patients) {
            return <div></div>
        }

        let patients_es = this.props.patients_es.slice()
        patients_es.map(patient_es => {
            patient_es.inRoom = false
            const patient = this.props.patients.find(patient => patient.devices[0].uuid === patient_es.id)
            patient_es.bed = patient ? parseInt(patient.bed.id) : 0
            patient_es.name = patient ? patient.name : ''
        })
        patients_es.sort((a, b) => (a.bed > b.bed) ? 1 : -1)

        return <Grid container className={classes.gridContainerMain} justify="flex-start" alignItems='flex-start'>
            {this.props.rooms && this.props.rooms.map((room) => (
                room.name.includes("#01") === true ? 
                <Grid container className={classes.gridContainerRoom} key={room.name}>
                    <Grid item xs={12}>
                        <Typography gutterBottom variant="h5">
                            <strong>{room.name}</strong>
                        </Typography>
                    </Grid>
                    {room.devices && patients_es.filter(p => room.devices.some(d => d.uuid === p.id)).map((patient) => {
                            patient.inRoom = true
                            return (
                                <Grid item className={classes.gridCard} xs={4} sm={4} md={3} lg={2} xl={1}
                                      key={patient.id} onClick={() => this.displaySinglePatient(patient.id)}>
                                    <PatientReading patient={patient}/>
                                </Grid>
                            )
                        }
                    )}
                </Grid> : void 0
            ))}
        </Grid>;
    }

    render() {
        const {classes} = this.props;
        console.log (this.props.patients_es)
        return (
            <div className={classes.root}>
                {this.renderAppBar()}
                {this.renderMiscGrid()}
                {this.renderMainGrid()}
            </div>
        );
    };
}

const ConnectedDashboard = connect(mapStateToProps, mapDispatchToProps)(PatientDashboard);

export default withStyles(styles)(ConnectedDashboard);