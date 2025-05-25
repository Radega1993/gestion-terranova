import { Grid as MuiGrid, GridProps } from '@mui/material';

export const Grid = (props: GridProps) => {
    return <MuiGrid {...props} />;
};

export const GridItem = (props: GridProps) => {
    return <MuiGrid item {...props} />;
};

export const GridContainer = (props: GridProps) => {
    return <MuiGrid container {...props} />;
}; 