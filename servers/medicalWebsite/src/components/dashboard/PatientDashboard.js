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

import {signOutUser, verifyAuth, fetchDashboardPatients, fetchDashboardPatients2} from "../../actions";
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
    container: {
        padding: 100,

    },
    title: {
        paddingBottom: '.3em',
        paddingTop: '1em',
    },
    AppBar: {
        borderBottom: '1px solid #f2f3f3',
    }
};

const mapStateToProps = state => {
    return {
        username: state.username,
        authenticated: state.authenticated,
        isAuthenticating: state.isAuthenticating,
        patients: state.patients_d
    };
};

const mapDispatchToProps = dispatch => {
    return {
        signOutUser: username => dispatch(signOutUser(username)),
        verifyAuth: credentials => dispatch(verifyAuth(credentials)),
        fetchDashboardPatients: () => dispatch(fetchDashboardPatients()),
        fetchDashboardPatients2: () => dispatch(fetchDashboardPatients2())
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

        this.updatePatients()
        this.timer = setInterval(() => this.updatePatients(), 5000);
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

    updatePatients() {
        this.props.fetchDashboardPatients();
        // this.props.fetchDashboardPatients2();
    }

    toggleDrawer = () => {
        this.setState({drawer: true});
    }

    toggleCloseDrawer = () => {
        this.setState({ drawer: false });
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
                    <TemporaryDrawer toggle={this.state.drawer} />
                </ClickAwayListener>
                <Grid container className={classes.container} justify="flex-start" alignItems='center' spacing={16}>
                    {
                        this.props.patients && this.props.patients.map((patient) => (
                                <Grid item xs={4} sm={4} md={3} lg={2} xl={1} key={patient["id"]}>
                                    <PatientReading patient={patient}/>
                                </Grid>
                            )
                        )
                    }
                </Grid>
            </div>
        );
    };
}

const ConnectedDashboard = connect(mapStateToProps, mapDispatchToProps)(PatientDashboard);

export default withStyles(styles)(ConnectedDashboard);

