import React, {Component} from 'react';
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
import ClickAwayListener from "@material-ui/core/ClickAwayListener";

import TemporaryDrawer from '../../TemporaryDrawer.js';

import {
    signOutUser,
    verifyAuth,
    fetchRooms,
    readPatients,
    fetchDashboardPatients,
    fetchDashboardPatients2,
    loadInfo
} from "../../actions";
import {connect} from "react-redux";
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
    },
    gridContainerRoom: {
        padding: 20,
        border: '2px solid #000000',
    },
    gridCard: {
        padding: 5
    }

};

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
        console.log("PatientDashboard mount")

        this.props.fetchRooms()
        this.props.readPatients()
        this.updatePatientsES()
        this.timer = setInterval(() => this.updatePatientsES(), 3000);
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

    render() {
        const {classes} = this.props;
        const {anchorEl, auth} = this.state;
        const open = Boolean(anchorEl)

        if (!this.props.rooms || !this.props.patients_es || !this.props.patients) {
            return <div></div>
        }

        this.props.patients_es.map(patient_es => {
            patient_es.inRoom = false
            const patient = this.props.patients.find(patient => patient.devices[0].id == patient_es.id)
            patient_es.bed = patient? parseInt(patient.bed.id) : 0
        })

        this.props.patients_es.sort((a, b) => (a.bed > b.bed) ? 1 : -1)

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
                <ClickAwayListener onClickAway={this.toggleCloseDrawer}>
                    <TemporaryDrawer toggle={this.state.drawer}/>
                </ClickAwayListener>
                <Grid container className={classes.gridContainerMain} justify="flex-start" alignItems='center'>
                    {this.props.rooms && this.props.rooms.map((room) => (
                        <Grid container className={classes.gridContainerRoom} key={room.name}>
                            <Grid item xs={12}>
                                <Typography gutterBottom variant="h5" onClick={() => {console.log('click room')}}>
                                    <strong>{room.name}</strong>
                                </Typography>
                            </Grid>
                            {room.devices && this.props.patients_es.filter(p => room.devices.some(d => d.id === p.id)).map((patient) => {
                                    patient.inRoom = true
                                    return (
                                        <Grid item className={classes.gridCard} xs={4} sm={4} md={3} lg={2} xl={1}
                                              key={patient["id"]} onClick={() => this.displaySinglePatient(patient["id"])}>
                                            <PatientReading patient={patient}/>
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
                    {/*    {this.props.patients_es.filter(p => p.inRoom === false).map((patient) => (*/}
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