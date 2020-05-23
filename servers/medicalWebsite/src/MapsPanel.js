import React, { Component } from 'react'
import IconButton from '@material-ui/core/IconButton';
import { withStyles } from '@material-ui/core/styles'
import pink from '@material-ui/core/colors/pink'
import MapConfigIcon from '@material-ui/icons/EditLocation'
import MapMeasureIcon from '@material-ui/icons/Build'
import MapAssignIcon from '@material-ui/icons/PinDrop'
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import Switch from '@material-ui/core/Switch';
import purple from '@material-ui/core/colors/purple';

const styles = theme => ({
	button: {
		position: 'absoulute',
	},
	input: {
	  display: 'none',
	},
	pinkAvatar: {
		margin: 10,
		color: '#fff',
		backgroundColor: pink[500],
      },
      iconButton: {
          left:100,
          marginRight: 200
      },
      colorSwitchBase: {
        color: purple[300],
        '&$colorChecked': {
          color: purple[500],
          '& + $colorBar': {
            backgroundColor: purple[500],
          },
        },
      },
      colorBar: {},
      colorChecked: {},
  });

  class MapsPanel extends Component {
    state = {
      mapConfig: null,
      mapMeasure: null,
      mapAssign: null,
      open: false,
      open1: false,
      open2: false,
      troubleshoot: false
    };

    handleClickOpen = () => {
      this.setState({
        open: true
      });
    };

    handleClose = () => {
      this.setState({ open: false });
    };
    handleClose1 = () => {
      this.setState({ open1: false });
    };
    handleClose2 = () => {
      this.setState({ open2: false });
    };

    handleConfigChange = event => {
        this.setState({ auth: event.target.checked });
      };
    
      handleConfigMenu = event => {
        this.setState({ mapConfig: event.currentTarget });
      };
    
      handleConfigClose = () => {
        this.setState({ mapConfig: null });
      };
    
      handleMeasureChange = event => {
        this.setState({ auth: event.target.checked });
      };
    
      handleMeasureMenu = event => {
        this.setState({ mapMeasure: event.currentTarget });
      };
    
      handleMeasureClose = () => {
        this.setState({ mapMeasure: null, open1: true });
      };

      handleAssignChange = event => {
        this.setState({ auth: event.target.checked });
      };
    
      handleAssignMenu = event => {
        this.setState({ mapAssign: event.currentTarget });
      };
    
      handleAssignClose = () => {
        this.setState({ mapAssign: null, open2: true });
      };

      handleLoadOpen = () => {
        this.handleConfigClose();
        this.props.onLoad();
      };

      handleCreateOpen = () => {
        this.handleConfigClose();
        this.props.onCreate();
      };

      handleEditOpen = () => {
        this.handleConfigClose();
        this.props.onEdit();
      };

      handleDeleteOpen = () => {
        this.handleConfigClose();
        this.props.onDelete();
      };

      handleMeasureOpen = () => {
        this.handleMeasureClose();
        this.props.onMeasure();
      };

      handleAssignDeviceOpen = () => {
        this.handleAssignClose();
        this.props.onAssignStaticDevice();
      };

      handleAssignPOIOpen = () => {
        this.handleAssignClose();
        this.props.onAssignPOI();
      };

      handleAssignNavPathOpen = () => {
        this.handleAssignClose();
        this.props.onAssignNavPath();
      };

      handleAssignNavMeshOpen = () => {
        this.handleAssignClose();
        this.props.onAssignNavMesh();
      };

      handleTroubleshootOption = () => {
        this.setState({ troubleshoot: !this.state.troubleshoot })
        this.props.onTroubleshoot(!this.state.troubleshoot);
      }
      
    render() {
      const { classes } = this.props;
      const { mapConfig, mapMeasure, mapAssign } = this.state;
      const openConfig = Boolean(mapConfig);
      const openMeasure = Boolean(mapMeasure);
      const openAssign = Boolean(mapAssign);
      return(
        <ul style={{"float":"right"}}>
          {/* <p><IconButton
            className={classes.menuButton}
            aria-owns={openConfig ? 'map-config' : undefined}
            aria-haspopup="true"
            onClick={this.handleConfigMenu}
            color="inherit"
          >
            <MapConfigIcon/>
          </IconButton>
          <Menu
                id="map-config"
                anchorEl={mapConfig}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                open={openConfig}
                onClose={this.handleConfigClose}
              >
                <MenuItem onClick={this.handleLoadOpen}>Load</MenuItem>
                <MenuItem onClick={this.handleCreateOpen}>Create</MenuItem>
                <MenuItem onClick={this.handleEditOpen}>Edit</MenuItem>
                <MenuItem onClick={this.handleDeleteOpen}>Delete</MenuItem>
              </Menu></p> */}
              {/* <p><IconButton 
                      className={classes.menuButton}
                      aria-owns={openMeasure ? 'measure' : undefined}
                      aria-haspopup="true"
                      onClick={this.handleMeasureMenu}
                      color="inherit"
                  >
                      <MapMeasureIcon/>
                  </IconButton></p>
                  <Menu
                id="measure"
                anchorEl={mapMeasure}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                open={openMeasure}
                onClose={this.handleMeasureClose}
              >
                <MenuItem onClick={this.handleMeasureOpen}>Measure</MenuItem>
              </Menu> */}
              <p><IconButton 
                      className={classes.menuButton}
                      aria-owns={openMeasure ? 'assign' : undefined}
                      aria-haspopup="true"
                      onClick={this.handleAssignDeviceOpen}
                      color="inherit"
                  >
                      <MapAssignIcon/>
                  </IconButton></p>
                  {/* <Menu
                id="assign"
                anchorEl={mapAssign}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'left',
                }}
                open={openAssign}
                onClose={this.handleAssignClose}
              > */}
                {/* <MenuItem onClick={this.handleAssignDeviceOpen}>Static Device</MenuItem> */}
                {/* <MenuItem onClick={this.handleAssignPOIOpen}>POI</MenuItem>
                <MenuItem onClick={this.handleAssignNavPathOpen}>NavPath</MenuItem>
                <MenuItem onClick={this.handleAssignNavMeshOpen}>NavMesh</MenuItem> */}
              {/* </Menu> */}
              {/* <p>
                <Switch
                  checked={this.state.troubleshoot}
                  value={this.state.troubleshoot}
                  onClick={this.handleTroubleshootOption}
                  classes={{
                    switchBase: classes.colorSwitchBase,
                    checked: classes.colorChecked,
                    bar: classes.colorBar,
                  }} 
                />
              </p> */}
        </ul>
      )
    }
  }
  export default withStyles(styles, {withTheme: true})(MapsPanel)