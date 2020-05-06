import React from 'react';
import PropTypes from 'prop-types';
import TableCell from '@material-ui/core/TableCell';
import Typography from '@material-ui/core/Typography';

class Result extends React.Component {
    render() {
        const result = this.props.result;

        if (!result) {
            return null;
        }
        return (
            <Typography variant="subtitle1">
            {result.codeResult.code}
            </Typography>
        );
    }
};

Result.propTypes = {
    result: PropTypes.object
};
export default Result;
