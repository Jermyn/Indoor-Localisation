import React, { Component } from 'react'
import { connect } from 'react-redux'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import { withStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar';
import StaticDevicesTable from '../components/devicesTable/StaticDevicesTable';
import Typography from '@material-ui/core/Typography';
import MobileDevicesTable from '../components/devicesTable/MobileDevicesTable';
import Actions from '../store/actions/actions'

function TabContainer(props) {
    return (
      <Typography component="div" style={{ padding: 8 * 3 }}>
        {props.children}
      </Typography>
    );
}

const styles = theme => ({
    root: {
      flexGrow: 1,
      backgroundColor: theme.palette.background.paper,
    },
});


class Devices extends Component {
    state = {
        value: 0,
    };

    componentDidMount() {
        const { actions } = this.props;
        actions.devices.fetch()
    }
    
    handleChange = (event, value) => {
        this.setState({ value });
    };

    onCreateDevice = (device) => {
        const { actions } = this.props;
        actions.devices.create(device)
    };

    onDeleteDevice = (id) => {
        const { actions } = this.props;
        actions.devices.delete(id)
    };

    onEditDevice = (device) => {
        const { actions } = this.props;
        actions.devices.update(device)
    };

    render() {
        const { classes, mobileDevices, staticDevices } = this.props;
        const { value } = this.state;
        console.log (staticDevices)
        return(
            <div className={classes.root}>
                <AppBar position="static">
                    <Tabs variant="fullWidth" value={value} onChange={this.handleChange}>
                        <Tab label="Static Devices"/>
                        <Tab label="Mobile Devices" />
                    </Tabs>
                </AppBar>
                {value === 0 && <TabContainer><StaticDevicesTable devices={staticDevices} onCreate={this.onCreateDevice} onEdit={this.onEditDevice} onDelete={this.onDeleteDevice}/></TabContainer>}
                {value === 1 && <TabContainer><MobileDevicesTable devices={mobileDevices} onCreate={this.onCreateDevice} onEdit={this.onEditDevice} onDelete={this.onDeleteDevice} onConnect={this.onEditDevice}/></TabContainer>}
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        mobileDevices: state.devices.mobileDevices,
        staticDevices: state.devices.staticDevices
    }
}

export default connect(mapStateToProps, Actions)(withStyles(styles)(Devices))