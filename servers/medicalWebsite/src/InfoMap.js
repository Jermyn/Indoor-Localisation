import React, {Component} from 'react';
import { connect } from "react-redux";
import { fetchMaps, confirmType, fetchDeviceLocations } from "./actions/index";
import MapGL, {Marker, Popup, NavigationControl} from 'react-map-gl';
import ReactMapboxGl from 'react-mapbox-gl';
import { Source, Layer, Feature } from "react-mapbox-gl";
import mapboxgl from 'mapbox-gl';
// import StatePin from './StatePin'
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import axios from 'axios';
const e             = React.createElement;

const restUrlHTTPS = `http://137.132.165.139:3000/api`;

const TOKEN = 'pk.eyJ1IjoiZnlwZW5nIiwiYSI6ImNqcmFlazM4YjAxejkzeW1wbWg2Zmp2aWsifQ.obOnEjbqcpEWu9HIh6zPlw'; // Set your mapbox token here
const graphqlUrlHTTPS = 'http://137.132.165.139:3000/graphql';

const ReactMap = ReactMapboxGl({
  accessToken: `${TOKEN}`,
  maxZoom:    13,
  minZoom:    8,
})
const navStyle = {
  position: 'absolute',
  top: 0,
  left: 0,
  padding: '10px'
};

const mapStateToProps = state => {

  return {
    maps: state.maps,
    devices: state.devices,
    deviceLogs: state.deviceLogs,
    patients: state.patients,
    assets: state.assets,
    staff: state.staff,
    info: state.info,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    confirmType: type => dispatch(confirmType(type)),
    fetchMaps: maps => dispatch(fetchMaps(maps)),
    fetchDeviceLocations: deviceLogs => dispatch(fetchDeviceLocations(deviceLogs))
  };
};

class InfoMap extends Component {

  constructor(props) {
    super(props);
    this.state = {
      viewport: {
        latitude: 37.785164,
        longitude: -100,
        zoom: 2.8,
        bearing: 0,
        pitch: 0,
        width: 500,
        height: 500,
      },
      popupInfo: null,
      map: '',
      loading: true,
      sourceOptions: {},
      center: [-0.2416815, 51.5285582 ],
      staticDevices: "",
      mobileDevices: [],
      assetDevices: [],
      staffDevices: [],
      circleRadius: 30,
      loadingStep: 1,

    };
  }

  componentDidMount() {
    this.fetch()

  }

  fetch = (dispatch) => {
    let query = `
      query {
        maps {
          id
          scale
          coordinates
          imageURL
          navMesh
          navPath
          pois
        }
      }
    `
    this.request({query})
    .then ((data) => {
        let loading = this.state.loading
        if(loading) {
          this.getDeviceLogs()
        }
        this.props.fetchMaps(data.data.data.maps)
      }
    )
  }

  request = ({query, variables}) => {
    let promise = axios({
      method:   'post',
      url:      `${graphqlUrlHTTPS}`,
      headers:  {'Content-Type': 'application/json'},
      data:     JSON.stringify({query, variables})
    })
    return promise;
  }

  getDeviceLogs = (dispatch) => {

    let promise = axios({
      method:   'get',
      url:      `${restUrlHTTPS}/Devices/logs`,
      headers:  {'Content-Type': 'application/json'},
    }).then (data => {

        this.props.fetchDeviceLocations(data.data)
      }
    )
    return promise;
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._resize);
  }

  componentDidUpdate(prevProps, prevState) {

    if(this.props.deviceLogs !== prevProps.deviceLogs) {
      if(this.state.map == '' && this.state.loading == true) {
        let beacon = "b1"

        if(this.props.info != "" && this.props.info != null) {
          beacon = this.props.info.beacon[0]
        }
        let map = ''
        this.props.deviceLogs.map(log => {
          if(log.id == beacon) {
            map = log.map.id
          }
        })

        this.props.maps.map(displayMap => {
          if(displayMap.id == map) {
            map = displayMap

            let newObj = JSON.parse(JSON.stringify(displayMap))
            this.setState({map: newObj})
          }
        })

        this.initializeMap(map)
        this.setState({loading : false})
        this.timer = setInterval(()=> this.getDeviceLogs(), 1000);
      }
      this.createBeaconMarkers()
    }
  }

  getChildContext() {
    return {map: this.state.map};
  }
  mapgl = () => {
    return this.refs.map.getChildContext().map;
  }

  getChildContext = () => {
    return { map: this.map };
  };

  createBeaconMarkers = (initialize) => {

    let map = this.state.map
    if(initialize != null) {
      map = initialize;
    }
    if(map != "") {
      let filteredLogs = this.props.deviceLogs.filter(device => device.map.id == map.id);
      let mobileDevices = []
      let staffDevices = []
      let assetDevices = []

      filteredLogs = filteredLogs.filter(device => device.id == this.props.info.beacon[0]);
      filteredLogs.map(device => {
        if(this.props.info.type == "Patient") {
          this.props.patients.forEach(patient => {
            if(patient.beacon != null) {
            if(device.id == patient.beacon[0]) {
              let newObj = JSON.parse(JSON.stringify(device))
              newObj.id = patient.name
              mobileDevices.push(newObj)
            }
          }
          })
        } else if(this.props.info.type == "Asset") {
          this.props.assets.forEach(asset => {
            if(asset.beacon != null) {
            if(device.id == asset.beacon[0]) {
              let newObj = JSON.parse(JSON.stringify(device))
              newObj.id = asset.name
              assetDevices.push(newObj)
            }
          }
          })
        } else {
          this.props.staff.forEach(staffmem => {
            if(staffmem.beacon != null) {
            if(device.id == staffmem.beacon[0]) {
              let newObj = JSON.parse(JSON.stringify(device))
              newObj.id = staffmem.name
              staffDevices.push(newObj)
            }
          }
          })
        }
      })

      this.setState({mobileDevices})
      this.setState({staffDevices})
      this.setState({assetDevices})

    }

  }
  initializeMap = (map, jump) => {

    this.setState({initial: map})
    this.setState({map})


    let sourceOptions = {
      coordinates: (map != null ? map.coordinates : undefined),
      type:         'image',
      url:          (map != null ? map.imageURL : undefined)
    }
    this.setState({sourceOptions})

    if(map != "" && this.props.info != "" && this.props.info != null) {
      const bounds = new mapboxgl.LngLatBounds(this.__guard__(map != null ? map.coordinates : undefined, x => x[3]), this.__guard__(map != null ? map.coordinates : undefined, x1 => x1[1]));
      let center = bounds.getCenter();
      this.setState({center});
      let filteredLogs = this.props.deviceLogs.filter(device => device.map.id == map.id);
      filteredLogs = filteredLogs.filter(device => device.id == this.props.info.beacon[0]);
      let mobileDevices = []
      let assetDevices = []
      let staffDevices = []
      filteredLogs.map(device => {
        if(this.props.info.type == "Patient") {

          this.props.patients.forEach(patient => {
            if(patient.beacon != null) {
            if(device.id == patient.beacon[0]) {
              let newObj = JSON.parse(JSON.stringify(device))
              newObj.id = patient.name
              mobileDevices.push(newObj)
            }
          }
          })
        } else if(this.props.info.type == "Asset") {
          this.props.assets.forEach(asset => {
            if(asset.beacon != null) {
            if(device.id == asset.beacon[0]) {
              let newObj = JSON.parse(JSON.stringify(device))
              newObj.id = asset.name
              assetDevices.push(newObj)
            }
          }
          })
        } else {
          this.props.staff.forEach(staffmem => {
            if(staffmem.beacon != null) {
            if(device.id == staffmem.beacon[0]) {
              let newObj = JSON.parse(JSON.stringify(device))
              newObj.id = staffmem.name
              staffDevices.push(newObj)
            }
          }
          })

        }
      })

      this.setState({mobileDevices})
      this.setState({assetDevices})
      this.setState({staffDevices})
      let staticDevices = this.props.devices.filter(device => device.type == 'static');
      staticDevices = staticDevices.filter(device => device.location != null)
      staticDevices = staticDevices.filter(device => device.location.map.id == map.id)
      this.setState({staticDevices})
      this.setState({loading: false})
      this.createBeaconMarkers(map)
    }

  }

  onStyleLoad = (mapgl) => {
    const { onLoad, map } = this.props;
    if (map != null) { this.initializeMap(map); }
  }

  getCirclePaint = () => ({
    'circle-radius': this.state.circleRadius,
    'circle-color': '#FFFF00',
    'circle-opacity': 0.4
  });

  _resize = () => {
    this.setState({
      viewport: {
        ...this.state.viewport,
        width: '100%',
        height: '70vh'
      }
    });
  };

  _updateViewport = (viewport) => {
    this.setState({viewport});
  }

  __guard__ = (value, transform) => {
    return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
  }

  renderHighlightDevices = () => {
    let patients = this.props.patients;
    let beacons = this.state.mobileDevices;
    let devices = []
    for(let i = 0 ; i < patients.length; i++) {

      beacons.map((device) => {
        if(patients[i].beacon == device.id && patients[i].highlight == true) {
        devices.push(
        <Feature
          key={device.id}
          coordinates={[device.lng, device.lat]}
          properties={{
            title:  device.id,
            id:     device.id
          }}
        />)
      }})

    }

    return devices;
  }
  renderDevices = (type) => {
    let devices = []
    let createDevices = []
    if(type == 'static')
      createDevices = this.state.staticDevices.map ((device) => {
        devices.push(
        <Feature
          key={device.id}
          coordinates={[device.location.lng, device.location.lat]}
          properties={{
            title:  device.id,
            id:     device.id
          }}
        />)
      })
    else {
      createDevices = this.state.mobileDevices.map((device) => {
        devices.push(
        <Feature
          key={device.id}
          coordinates={[device.lng, device.lat]}
          properties={{
            title:  device.id,
            id:     device.id
          }}
        />)
      })
    }

    createDevices = createDevices

    console.log(devices)
    return devices;
  }
  renderPopup = () => {
    return this.state.popupInfo && (
      <Popup tipSize={5}
        anchor="bottom-right"
        longitude={this.state.popupInfo.state.longitude}
        latitude={this.state.popupInfo.state.latitude}
        onClose={() => this.setState({popupInfo: null})}
        closeOnClick={true}>
        <h4>{this.state.popupInfo.state.fullName}</h4>
        <p>{this.state.popupInfo.incidentNumber} {this.state.popupInfo.disaster} incident(s)</p>
        <div class="text-center">
        <img src={this.state.popupInfo.icon.imgUrl} style={{height: "50px"}} />
        </div>
      </Popup>

      )
  }

  renderStaffDevices = () => {
    let devices = []
    this.state.staffDevices.map((device) => {
      devices.push(
      <Feature
        key={device.id}
        coordinates={[device.lng, device.lat]}
        properties={{
          title:  device.id,
          id:     device.id
        }}
      />)
    })

    return devices
  }

  renderAssetDevices = () => {
    let devices = []
    this.state.assetDevices.map((device) => {
      devices.push(
      <Feature
        key={device.id}
        coordinates={[device.lng, device.lat]}
        properties={{
          title:  device.id,
          id:     device.id
        }}
      />)
    })

    return devices
  }


  render() {

    const {viewport} = this.state;
    let sourceOptions = this.state.sourceOptions
    let imageURL = "mapbox://styles/mapbox/dark-v9";
    let center = this.state.center
    if(this.props.map != "") {
    }
    const { children, onLoad, map, height, width } = this.props;
    let locationOrigin = window.location.origin
    let style = {
        version:  8,
        name:     'custom',
        sources:  {},
        sprite:   `${locationOrigin}/mapbox-styles/maki`,
        glyphs:   `${locationOrigin}/mapbox-styles/font/{fontstack}/{range}.pbf`,
        layers:   []
    }

    return (
      <div>
      <ReactMap
        style={style}
        center={center}
        movingMethod={'jumpTo'}
        ref={this.mapLocation}
        containerStyle={{
          height: '70vh',
          width: '100%'}}
        onStyleLoad={this.onStyleLoad}
      >

      <Layer type="symbol"
      id="staticDevices"
      layout={{
        'icon-image':             'triangle-15',
        'icon-allow-overlap':     true,
        'icon-ignore-placement':  true,
        'text-allow-overlap':     true,
        'text-ignore-placement':  true,
        'text-field':             '{title}',
        'text-font':              ['Open Sans Semibold'],
        'text-offset':            [0, 0.8],
        'text-anchor':            'top',
      }}>

      {
        //this.state.staticDevices != "" ? this.renderDevices('static') : null
      }
      </Layer>

      <Layer type="circle"  paint={this.getCirclePaint()}>
      {
      //  this.renderHighlightDevices()
      }
      </Layer>
      <Layer type="symbol"
      id="patientDevices"
      layout={{
        'icon-image':             'marker-15',
        'icon-allow-overlap':     true,
        'icon-ignore-placement':  true,
        'text-allow-overlap':     true,
        'text-ignore-placement':  true,
        'text-field':             '{title}',
        'text-font':              ['Open Sans Semibold'],
        'text-offset':            [0, 0.8],
        'text-anchor':            'top',
      }}>

      {
        /*this.state.mobileDevices != "" ? this.renderDevices('mobile') : null */
        this.renderDevices('mobile')
      }
      </Layer>
      <Layer type="symbol"
      id="staffDevices"
      layout={{
        'icon-image':             'hospital-15',
        'icon-allow-overlap':     true,
        'icon-ignore-placement':  true,
        'text-allow-overlap':     true,
        'text-ignore-placement':  true,
        'text-field':             '{title}',
        'text-font':              ['Open Sans Semibold'],
        'text-offset':            [0, 0.8],
        'text-anchor':            'top',
      }}>

      {
        /*this.state.mobileDevices != "" ? this.renderDevices('mobile') : null */
        this.renderStaffDevices()
      }
      </Layer>
      <Layer type="symbol"
      id="assetDevices"
      layout={{
        'icon-image':             'suitcase-15',
        'icon-allow-overlap':     true,
        'icon-ignore-placement':  true,
        'text-allow-overlap':     true,
        'text-ignore-placement':  true,
        'text-field':             '{title}',
        'text-font':              ['Open Sans Semibold'],
        'text-offset':            [0, 0.8],
        'text-anchor':            'top',
      }}>

      {
        /*this.state.mobileDevices != "" ? this.renderDevices('mobile') : null */
        this.renderAssetDevices()
      }
      </Layer>
      {this.state.map != "" ?
      <Source id="image_source" tileJsonSource={sourceOptions} />
      : null}
      <Layer id="image_layer" before="staticDevices" type="raster" sourceId="image_source"/>
    </ReactMap>

    <Typography variant="h6" gutterBottom style={{marginTop: '1em'}}>{this.state.map != "" ? `Location: ${this.state.map.id}` : null} </Typography>
    </div>
  )
  }

}
const ConnectedInfoMap = connect(mapStateToProps, mapDispatchToProps)(InfoMap);

export default ConnectedInfoMap;
