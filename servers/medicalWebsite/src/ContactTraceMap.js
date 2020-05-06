import React, {Component} from 'react';
import { connect } from "react-redux";
import { fetchMaps, confirmType, fetchContactTrace } from "./actions/index";
import MapGL, {Marker, Popup, NavigationControl} from 'react-map-gl';
import ReactMapboxGl from 'react-mapbox-gl';
import { Source, Layer, Feature } from "react-mapbox-gl";
import mapboxgl from 'mapbox-gl';
// import StatePin from './StatePin'
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import Slider from '@material-ui/lab/Slider';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import axios from 'axios'
const e             = React.createElement;


const TOKEN = 'pk.eyJ1IjoiZnlwZW5nIiwiYSI6ImNqcmFlazM4YjAxejkzeW1wbWg2Zmp2aWsifQ.obOnEjbqcpEWu9HIh6zPlw'; // Set your mapbox token here
const graphqlUrlHTTPS = 'http://137.132.165.139:3000/graphql';


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

  demo: {
    padding: '16px 24px 24px',
    [theme.breakpoints.up("sm")]: {
      width: '560px'
    },
    [theme.breakpoints.up("md")]: {
      width: '700px'
    },
    [theme.breakpoints.up("lg")]: {
      width: '800px'
    }
  }
});

const ReactMap = ReactMapboxGl({
  accessToken: `${TOKEN}`,
  maxZoom:    10.5,
  minZoom:    0,
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
    map: state.map,
    devices: state.devices,
    deviceLogs: state.deviceLogs,
    patients: state.patients,
    contactTrace: state.contactTrace,
    traceDetails: state.traceDetails,
    filterTrace: state.filterTrace,
  };
};

const mapDispatchToProps = dispatch => {
  return {
    confirmType: type => dispatch(confirmType(type)),
    fetchMaps: maps => dispatch(fetchMaps(maps)),
    fetchContactTrace: traceDetails => dispatch(fetchContactTrace(traceDetails)),
  };
};

class ContactTraceMap extends Component {

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
      sourceOptions: {},
      center: [0, 0],
      staticDevices: "",
      mobileDevices: "",
      circleRadius: 20,
      value: 0,
      max: 6,
      playback: false,

    };

  }

  componentDidMount() {
    window.addEventListener('resize', this._resize);
    this.fetch()
    this._resize();
    if(this.props.map != null) {
      this.initializeMap(this.props.map);
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this._resize);
  }

  componentDidUpdate(prevProps) {
    if(this.props.contactTrace !== prevProps.contactTrace) {
      this.initializeMap(this.props.contactTrace)
    }
  }

  componentWillUnmount() {
    clearInterval(this.timer)
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
    .then ((data) =>
      this.props.fetchMaps(data.data.data.maps),
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
      this.setState({value: value})
    }
  }
  createFake = () => {
    let beacon = {id: 'b1', lat: '0.12689939700739615', lng: '0.2535276535309947', map: {id: 'MeetingRm'}}
    let beacon2 = {id: 'b2', lat: '0.14689939700739615', lng: '0.2535276535309947', map: {id: 'MeetingRm'}}
    let beacon3 = {id: 'b3', lat: '0.192689939700739615', lng: '0.2535276535309947', map: {id: 'MeetingRm'}}

    let beacons = [];
    beacons.push(beacon)
    beacons.push(beacon2)
    beacons.push(beacon3)
    return beacons
  }
  initializeMap = (data, jump) => {
    let maps = this.props.maps
    let map = ""
    maps.map(location => {
      if(location.id == "simulation_ward") {
        map = JSON.parse(JSON.stringify(location))
        map.coordinates = [[0, 0.114], [0.6217262964, 0.114], [0.6217262964, 0],[0,0]]
    //    (0,0), (0.6217262964, 0), (0, 0.1099696441), (0.6217262964, 0.1099696441)
      }
    })

    if(map != "") {
      this.setState({map})
    }

    let sourceOptions = {
      coordinates: (map != "" ? map.coordinates : undefined),
      type:         'image',
      url:          (map != "" ? map.imageURL : undefined)
    }
    this.setState({sourceOptions})

    if(this.props.contactTrace != null) {
      this.updateSlider()
      if(map != "") {
        const bounds = new mapboxgl.LngLatBounds(this.__guard__(map != "" ? map.coordinates : undefined, x => x[3]), this.__guard__(map != "" ? map.coordinates : undefined, x1 => x1[1]));
        let center = bounds.getCenter();
        this.setState({center});
      }
    }
  }

  updateSlider = () => {
    let lengthSlider = this.props.contactTrace.length -1
    this.setState({max: lengthSlider})
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

  getInfectedCircle = () => ({
    'circle-radius': this.state.circleRadius,
    'circle-stroke-width': 1.5,
    'circle-stroke-color': '#FF0000',
    'circle-opacity': 0
  })

  _resize = () => {
    this.setState({
      viewport: {
        ...this.state.viewport,
        width: this.props.width || window.innerWidth,
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


  renderInfectedCircle = () => {


    let contacts = this.props.contactTrace[this.state.value];

    let infected = []
    let beacon = this.props.traceDetails.name
    infected.push(
    <Feature
      key={this.props.traceDetails.name}
      coordinates={[contacts[beacon].latitude, contacts[beacon].longitude]}
      properties={{
        title:  this.props.traceDetails.name,
        id:     this.props.traceDetails.name
      }}
    />)

    return infected;
  }

  renderHighlightDevices = () => {

    let contactTrace = this.props.contactTrace[this.state.value]
    let devices = []
    let primaryContacts = this.props.filterTrace
    let timestamp = contactTrace.timestamp
    for (const key of Object.keys(primaryContacts)) {
      let index = key
      if(timestamp >= primaryContacts[key]  && contactTrace[index] != null) {
        devices.push(
           <Feature
             key={index}
             coordinates={[contactTrace[index].latitude, contactTrace[index].longitude]}
             properties={{
               title:  index,
               id:     index
             }}
           />)
      }
    }
    return devices;
  }
  renderDevices = (type) => {
    let devices = []
    let createDevices = []
    if(type == 'static') {
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
    } else {

      let contactTrace = this.props.contactTrace[this.state.value]

      const entries = Object.values(contactTrace)

        createDevices = entries.map((contact) => {
          if(typeof contact === 'object' && contact !== null && contact.beacon != null) {
            devices.push(
            <Feature
              key={contact.beacon}
              coordinates={[contact.latitude, contact.longitude]}
              properties={{
                title:  contact.beacon,
                id:     contact.beacon
              }}
            />)
          }
          })
        }

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

  formatUnix = () => {
    let unix = this.props.contactTrace[this.state.value].key
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

  };


  render() {

    const {viewport} = this.state;
    const { classes } = this.props;

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


    // return (
    //   <MapGL
    //     {...viewport}
    //     mapStyle={imageURL}
    //     onViewportChange={this._updateViewport}
    //     mapboxApiAccessToken={TOKEN} >
    //     {/*markers*/}
    //     {/*this.renderPopup()*/}
    //
    //   </MapGL>
    // );
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
        this.state.staticDevices != "" ? this.renderDevices('static') : null
      }
      </Layer>

      <Layer type="circle"  paint={this.getInfectedCircle()}>
      {
        this.props.filterTrace != null ? this.renderInfectedCircle() : null
      }
      </Layer>

      <Layer type="circle"  paint={this.getCirclePaint()}>
      {
        //this.props.contactTrace != null ? this.renderDevices('mobile') : null
         this.props.filterTrace != null ? this.renderHighlightDevices() : null
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
        'text-offset':            [0.6, 0.7],
        'text-anchor':            'bottom-left',
        'icon-size':  0.6,
      }}>

      {
        this.props.contactTrace != null ? this.renderDevices('mobile') : null

      }
      </Layer>
      {this.state.map != "" ?
      <div>
      <Source id="image_source" tileJsonSource={sourceOptions} />
      <Layer id="image_layer" before="staticDevices" type="raster" sourceId="image_source"/>
      </div>
      : null}

    </ReactMap>

    <Grid container justify="center">
    <Grid container
      className={classes.demo}
      justify="center"
      spacing={0}
      alignItems="center"
      style={{overflowX: 'hidden'}}
      >
      <Grid item xs={12}>
    <Typography variant="subtitle1">{this.props.contactTrace != null ? this.formatUnix() : this.state.value}</Typography>

    <Slider
        value={this.state.value}
        min={0}
        max={this.state.max}
        step={1}
        onChange={this.handleChange}
        />

        {this.state.playback == false ? <Button onClick={this.startPlayback}> Playback </Button> :
        <Button onClick={this.stopTimer}> Stop </Button>}
        </Grid>
        </Grid>
        </Grid>
    </div>
  )
  }

}
const ConnectedContactTraceMap = connect(mapStateToProps, mapDispatchToProps)(ContactTraceMap);

export default withStyles(styles)(ConnectedContactTraceMap);
