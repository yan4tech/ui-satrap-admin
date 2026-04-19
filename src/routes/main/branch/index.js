import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';
import asyncComponent from 'util/asyncComponent';

const Branch = ({ match }) => (
  <Switch>
    <Redirect exact from={`${match.url}/`} to={`${match.url}/create`} />
    <Route
      path={`${match.url}/create`}
      component={asyncComponent(() => import('./Create/index'))}
    />
    <Route
      path={`${match.url}/search`}
      component={asyncComponent(() => import('./Search/index'))}
    />
    <Route
      path={`${match.url}/edit/:id`}
      component={asyncComponent(() => import('./Edit/index'))}
    />
  </Switch>
);

export default Branch;
