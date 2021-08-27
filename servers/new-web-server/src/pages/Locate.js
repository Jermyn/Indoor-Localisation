import React, { Component } from 'react'
import _ from 'underscore'
import Promise from 'bluebird'
import { connect } from 'react-redux'
import MapsPanel from '../components/mapsConfig/MapsPanel'
import Actions from '../store/actions/actions'
import MaterialDialogForm from '../components/addDevices/MaterialDialogForm'
import LoadMap from '../components/mapsFunction/locate'
import { Observable } from 'rxjs/Rx'
import Visibility from 'visibilityjs'
import { indexOf } from '../draw-theme'
// import tweenState from 'react-tween-state'

class Locate extends Component {
    constructor(props) {
        super(props);
        this.state = {
            transientDevices: {},
            loadMapOpen: false,
            deviceLogs: {},
            selectedMap: null,
            movingDevice: {},
            troubleshoot: false
        }
        this.mapView = React.createRef()
        // this.mixins = [tweenState.Mixin]
    }
    

    componentDidMount() {
        const { actions } = this.props;
        actions.maps.fetch()
        actions.devices.fetch()
        actions.devices.fetchDeviceLogs()
        this.setState({ deviceLogs: this.props.deviceLogs })
        this.deviceLogs$ = Observable.interval(500).filter(() => 
            !Visibility.hidden()).switchMap(() => 
                actions.devices.fetchDeviceLogs()).subscribe()
    }

    componentWillUnmount() {
        this.deviceLogs$.unsubscribe()
    }

    static getDerivedStateFromProps(props, state) {
        if(props.deviceLogs !== state.deviceLogs) {
            return {
                deviceLogs: props.deviceLogs
            }
        }
        else {
            return null
        }
    }
    
    componentDidUpdate({deviceLogs}) {
        console.log(deviceLogs)
        let updateArr = []
        if (!_.isEqual(deviceLogs, this.props.deviceLogs)) {
            deviceLogs.forEach((oldDeviceLog) => {
                this.props.deviceLogs.forEach((deviceLog) => {
                    if (oldDeviceLog.id === deviceLog.id) {
                        if ((oldDeviceLog.lng !== deviceLog.lng) || (oldDeviceLog.lat !== deviceLog.lat)   ) {
                            updateArr.push(deviceLog);
                            this.setState({ movingDevice: updateArr })
                        }
                    }
                })
            })
            this.tweenTransientDevices(this.props.deviceLogs)
        }
    }

    tweenTransientDevices = (deviceLogs) => {
        let transitionDevices = {}
        let newDevices = {}
        deviceLogs.forEach(({id, lat, lng, map}) => {
            console.log({id, lat, lng, map});
            // if (neighbors !== undefined) { 
            transitionDevices[id] = {
                // neighbors: neighbors,
                lat: lat,
                lng: lng
            };
            if (this.state.transientDevices[id] != null) {
            transitionDevices[id] = {
                // neighbors: neighbors,
                lat: lat,
                lng: lng
            };
            } else {
            newDevices[id] = {
                // neighbors: neighbors,
                lat: lat,
                lng: lng
            };
            }
        });
          
        // add new devices
        this.setState({
        transientDevices: Object.assign({}, this.state.transientDevices, newDevices)
        });
        //Update current device
        this.setState({
        transientDevices: Object.assign({}, this.state.transientDevices, transitionDevices)
        });

        console.log(this.state.transientDevices)
          // transition devices
        //   _(transitionDevices).each(({lat, lng}, id) => {
        //     this.tweenState(['transientDevices', `${id}`, 'lat'], {
        //       duration: 1000,
        //       endValue: lat
        //     });
        //     this.tweenState(['transientDevices', `${id}`, 'lng'], {
        //       duration: 1000,
        //       endValue: lng
        //     });
        //   });
    }

    onLoadMap = (e, res) => {
        const { actions } = this.props;
        actions.maps.load(res)
        this.setState({ loadMapOpen: false })
    }

    onLoad = () => {
        const { actions } = this.props;
        Promise.all([
            actions.devices.fetch(),
            actions.devices.fetchDeviceLogs()
        ]).then(function() { this.tweenTransientDevices(this.props.deviceLogs) })
    }

    handleLoadClose = () => {
        this.setState({ loadMapOpen: false });
    };

    handleLoadOpen = () => {
        this.setState({ loadMapOpen: true });
    };

    handleChange = (e) => {
        this.setState({
            [e.target.id] : e.target.value
        })
    }

    handleSelectedMap = (e) => {
        this.setState({ selectedMap: e.target.value })
    };

    handleTroubleshoot = (troubleshootOpt) => {
        this.setState({ troubleshoot: troubleshootOpt })
    }

    render() {
        const { currentMap, maps, staticDevices } = this.props;
        let movingDevices = this.state.movingDevice
        console.log(this.state.deviceLogs)
        return (
            <div>
                <MapsPanel
                    onLoad={this.handleLoadOpen}
                    onTroubleshoot={this.handleTroubleshoot}
                />

                <LoadMap
                    ref={this.mapView}
                    map={currentMap}
                    staticDevices={staticDevices}
                    movingDevices={movingDevices}
                    onLoad={this.onLoad}
                    transientDevices={this.state.transientDevices}
                    onTroubleshoot={this.state.troubleshoot}
                />

                <MaterialDialogForm
                    title="Load Map"
                    open={this.state.loadMapOpen} 
                    onClose={this.handleLoadClose} 
                    aria_id="Load-Map"
                    onChange={this.handleChange}
                    onLoadMap={this.handleSelectedMap}
                    rows={[
                      {key: 'id', type: 'select', label: 'id', items: maps.map(({id}) => {return id})}
                    ]}
                    onSubmit={this.onLoadMap} 
                /> 
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        devices: state.devices,
        staticDevices: state.devices.staticDevices.filter(device =>
            (device.location !== null ? device.location.map.id : void 0) === (state.maps.currentMap !== null ? state.maps.currentMap.id : [])
        ),
        mobileDevices: state.devices.mobileDevices,
        deviceLogs: state.devices.deviceLogs.filter(({map, id}) =>
            (map != null ? map.id : void 0) === (state.maps.currentMap !== null ? state.maps.currentMap.id : []) && state.devices.devices.filter(({device}) => (device === id))
        ),
        maps: state.maps.maps,
        currentMap: state.maps.currentMap,
        featureCollection: state.maps.featureCollection
    }
}

export default connect(mapStateToProps, Actions)(Locate)
