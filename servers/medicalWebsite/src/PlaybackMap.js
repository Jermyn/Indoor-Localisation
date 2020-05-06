import React, {Component} from 'react';
import { connect } from "react-redux";
import { fetchMaps, confirmType, fetchDeviceLocations } from "./actions/index";
import MapGL, {Marker, Popup, NavigationControl} from 'react-map-gl';
import ReactMapboxGl from 'react-mapbox-gl';
import { Source, Layer, Feature } from "react-mapbox-gl";
import Slider from '@material-ui/lab/Slider';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import mapboxgl from 'mapbox-gl';
// import StatePin from './StatePin'
import { withStyles } from '@material-ui/core/styles';
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
    info: state.info
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
      circleRadius: 30,
      value: 0,
      max: 6,
      playback: false,

    };
    // this.mapLocation = React.createRef(),
    // this.inputNew = React.createRef()
  }

  componentDidMount() {
    this.fetch()
  }

  componentWillUnmount() {
    clearInterval(this.timer)
    this.timer = null
  }

  startPlayback = () => {
    let value = this.state.value
    value += 1
    if(value < this.state.max && this.state.playback == false) {
        this.timer = setInterval(()=> this.playback(), 100);
        this.setState({playback: true})
    }

  }

  stopTimer = () => {
    clearInterval(this.timer)
    this.setState({playback: false})
  }



  playback = () => {
    let value = this.state.value
    value += 1
    if(value > this.state.max) {
      this.stopTimer()
    } else {
      this.handleChange('', value)
    }
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

  updateSlider = () => {
    let lengthSlider = this.props.locationData.length -1
    this.setState({max: lengthSlider})
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

    if(this.props.locationData != prevProps.locationData) {
      this.updateSlider()
      if(this.state.map == '' && this.state.loading == true && this.props.locationData.length != 0) {

        let map = ''
        let locationData = this.props.locationData

        this.props.maps.map(displayMap => {
          if(displayMap.id == locationData[this.state.value]._source.map.id) {
            map = displayMap
            let newObj = JSON.parse(JSON.stringify(displayMap))
            this.setState({map: newObj})
          }
        })
        this.initializeMap(map)
        this.setState({loading : false})
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

      let mobileDevices = []
      let newObj = JSON.parse(JSON.stringify(this.props.locationData[this.state.value]._source))
      if(this.props.info != "" && this.props.info != null)
        newObj.id = this.props.info.name
      mobileDevices.push(newObj)
      this.setState({mobileDevices})
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

    if(map != "") {
      const bounds = new mapboxgl.LngLatBounds(this.__guard__(map != null ? map.coordinates : undefined, x => x[3]), this.__guard__(map != null ? map.coordinates : undefined, x1 => x1[1]));
      let center = bounds.getCenter();
      this.setState({center});
      let filteredLogs = this.props.deviceLogs.filter(device => device.map.id == map.id);
      let mobileDevices = []
      filteredLogs.map(device => {
        this.props.patients.forEach(patient => {
          if(device.id == patient.beacon) {
            //CHANGE TO PATIENT NAME
            let newObj = JSON.parse(JSON.stringify(device))
            newObj.id = patient.name
            mobileDevices.push(newObj)
          }
        })
      })
      this.setState({mobileDevices})
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
    return devices;
  }

  formatUnix = () => {
    let unix = this.props.locationData[this.state.value]._source.time /1000
    let months_arr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    let date = new Date(unix*1000);
    let year = date.getFullYear();
    let month = months_arr[date.getMonth()];
    let day = date.getDate();
    let hours = date.getHours();
    let minutes = "0" + date.getMinutes();
    let seconds = "0" + date.getSeconds();
    let convdataTime = day+'-'+month+'-'+year+' '+hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
    return convdataTime
  }

  handleChange = (event, value) => {
    this.setState({ value });
    if(this.props.locationData[value]._source.map.id != this.state.map.id) {
      let map = ""
      this.props.maps.map(displayMap => {
        if(displayMap.id == this.props.locationData[this.state.value]._source.map.id) {
          map = displayMap
          let newObj = JSON.parse(JSON.stringify(displayMap))
          this.setState({map: newObj})
        }
      })
      this.initializeMap(map)
    }
    this.createBeaconMarkers()
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
        this.renderHighlightDevices()
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
        this.renderDevices('mobile')
      }
      </Layer>
      {this.state.map != "" ?
      <Source id="image_source" tileJsonSource={sourceOptions} />
      : null}
      <Layer id="image_layer" before="staticDevices" type="raster" sourceId="image_source"/>
    </ReactMap>
    {this.state.map != "" ? <div>
    {this.state.playback == false ? <Button onClick={this.startPlayback}> Playback </Button> :
    <Button onClick={this.stopTimer}> Stop </Button>}
    <Typography variant="subtitle1">{this.props.locationData.length != 0 ? this.formatUnix() : this.state.value}</Typography>
    <Slider
        value={this.state.value}
        min={0}
        max={this.state.max}
        step={1}
        onChange={this.handleChange}
        />
      <Typography variant="h6" gutterBottom style={{marginTop: '1em'}}>{this.props.locationData.length != 0 ? `Location: ${this.props.locationData[this.state.value]._source.map.id}` : null} </Typography>
      </div> : null}
    </div>
  )
  }

}
const ConnectedInfoMap = connect(mapStateToProps, mapDispatchToProps)(InfoMap);

export default ConnectedInfoMap;
