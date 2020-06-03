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
    fetchDashboardPatients2,
    loadInfo
} from "../../actions";
import PatientReading from "./PatientReading";


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
        fetchDashboardPatients: () => dispatch(fetchDashboardPatients()),
        fetchDashboardPatients2: () => dispatch(fetchDashboardPatients2()),
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
        };
    }

    componentDidMount() {
        this.props.fetchRooms()
        this.props.readPatients()
        this.updatePatientsES()
        this.timer = setInterval(() => this.updatePatientsES(), 30000);
    }

    componentWillUnmount() {
        clearInterval(this.timer)
        this.timer = null;
    }

    componentDidUpdate(prevProps) {
        if (this.props.username != prevProps.username) {
            this.setState({username: this.props.username})
        }
        if (this.props.isAuthenticating == false && this.props.authenticated == false) {
            this.props.history.push('/');
        }
    }

    updatePatientsES() {
        this.props.fetchDashboardPatients();
        // this.props.fetchDashboardPatients2();
    }

    displaySinglePatient(id) {
        const patient = this.props.patients.find(patient => patient.devices[0].id == id)
        if (patient) {
            this.props.loadInfo(patient);
            console.log('1', patient)
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

    getPeriod() {
        const t = moment()
        const periodStart = t.hours() > checkpoints[0] ? Math.max.apply(Math, checkpoints.filter(x => x <= t.hours())) : checkpoints[3]
        const periodEnd = t.hours() < checkpoints[3] ? Math.min.apply(Math, checkpoints.filter(x => x > t.hours())) : checkpoints[0]

        return {periodStart: periodStart, periodEnd: periodEnd};
    }


    render() {
        const {classes} = this.props;
        const {anchorEl, auth} = this.state;
        const open = Boolean(anchorEl)

        if (!this.props.rooms || !this.props.patients_es || !this.props.patients) {
            return <div></div>
        }

        let patients_es = this.props.patients_es
        patients_es.map(patient_es => {
            patient_es.inRoom = false
            const patient = this.props.patients.find(patient => patient.devices[0].uuid == patient_es.id)
            patient_es.bed = patient? parseInt(patient.bed.id) : 0
            patient_es.name = patient? patient.name : ''
        })
        patients_es.sort((a, b) => (a.bed > b.bed) ? 1 : -1)

        const {periodStart, periodEnd} = this.getPeriod();

        return (
            <div className={classes.root}>
                <AppBar position="static" style={{boxShadow: "none", backgroundColor: "white"}}
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
                </AppBar>
                <Grid container className={classes.gridContainerMain}  justify="flex-start" alignItems='flex-start'>
                    <Grid item xs={4} >
                        <Grid item>
                            <Typography gutterBottom variant="h4" component="h4" color={'inherit'}>
                                <strong>Current Period: </strong>
                                {periodStart}:00 - {periodEnd}:00
                            </Typography>
                        </Grid>
                    </Grid>
                    <Grid item xs={4}>
                        <Grid item></Grid>
                    </Grid>
                    <Grid item xs={4} >
                        <Grid item className={classes.gridItemLegend}>
                            <Typography gutterBottom variant="h6" component="h2" color={'inherit'}>
                                <StopIcon style={{ color: '#777777' }}/> Inactive reading
                            </Typography>
                            <Typography gutterBottom variant="h6" component="h2" color={'inherit'}>
                                <StopIcon style={{ color: '#43a047' }}/> Normal Heart Rate and SpO2
                            </Typography>
                            <Typography gutterBottom variant="h6" component="h2" color={'inherit'}>
                                <StopIcon style={{ color: '#fb8c00' }}/> Abnormal Heart Rate or SpO2
                            </Typography>
                            <Typography gutterBottom variant="h6" component="h2" color={'inherit'}>
                                <StopIcon style={{ color: '#e53935' }}/> Abnormal Heart Rate and SpO2
                            </Typography>
                        </Grid>
                    </Grid>
                </Grid>

                <Grid container className={classes.gridContainerMain} justify="flex-start" alignItems='flex-start'>
                    {this.props.rooms && this.props.rooms.map((room) => (
                        <Grid container className={classes.gridContainerRoom} key={room.name}>
                            <Grid item xs={12}>
                                <Typography gutterBottom variant="h5" onClick={() => {console.log('click room')}}>
                                    <strong>{room.name}</strong>
                                </Typography>
                            </Grid>
                            {room.devices && patients_es.filter(p => room.devices.some(d => d.uuid === p.id)).map((patient) => {
                                    patient.inRoom = true
                                    return (
                                        <Grid item className={classes.gridCard} xs={4} sm={4} md={3} lg={2} xl={1}
                                              key={patient["id"]} onClick={() => this.displaySinglePatient(patient["id"])}>
                                            <PatientReading patient={patient} checkpoints={checkpoints}/>
                                        </Grid>
                                    )
                                }
                            )}
                        </Grid>
                    ))}
                    {/*<Grid container className={classes.gridContainerRoom}>*/}
                    {/*    <Grid item xs={12}>*/}
                    {/*        <Typography gutterBottom variant="h5" onClick={() => { console.log('click')}}>*/}
                    {/*            <strong>Unallocated</strong>*/}
                    {/*        </Typography>*/}
                    {/*    </Grid>*/}
                    {/*    {patients_es.filter(p => p.inRoom === false).map((patient) => (*/}
                    {/*        <Grid item className={classes.gridCard} xs={4} sm={4} md={3} lg={2} xl={1}*/}
                    {/*              key={patient["id"]}>*/}
                    {/*            <PatientReading patient={patient}/>*/}
                    {/*        </Grid>*/}
                    {/*    ))}*/}
                    {/*</Grid>*/}
                </Grid>
            </div>
        );
    };

}

const ConnectedDashboard = connect(mapStateToProps, mapDispatchToProps)(PatientDashboard);

export default withStyles(styles)(ConnectedDashboard);