import React from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'

import OtpWebapp from '../app'
import ArrivalPredictions from './components/ArrivalPredictions'
import Header from './components/Header'
import Home from './components/Home'
import RouteDetail from './components/RouteDetail'
import RoutesList from './components/RoutesList'
import StopDetail from './components/StopDetail'
import StopsList from './components/StopsList'

function AuthPlaceholder() {
  return (
    <div>
      <h2>Authentication</h2>
      <p>
        The auth screen from <code>/web</code> was not migrated yet because OTP-RR
        does not currently include the Supabase dependency.
      </p>
    </div>
  )
}

function NotificationsPlaceholder() {
  return (
    <div>
      <h2>Schedules</h2>
      <p>
        The notification scheduler from <code>/web</code> was not migrated yet
        because OTP-RR does not currently include the Supabase dependency.
      </p>
    </div>
  )
}

function NavigationTab() {
  return <OtpWebapp />
}

export default function AppShell() {
  return (
    <Router>
      <Header />
      <Switch>
        <Route component={Home} exact path='/' />
        <Route component={RoutesList} exact path='/routes' />
        <Route component={RouteDetail} path='/routes/:routeId' />
        <Route component={StopsList} exact path='/stops' />
        <Route component={StopDetail} path='/stops/:stopId' />
        <Route component={ArrivalPredictions} path='/arrivals' />
        <Route component={NotificationsPlaceholder} path='/notifications' />
        <Route component={AuthPlaceholder} path='/auth' />
        <Route component={NavigationTab} path='/navigation' />
      </Switch>
    </Router>
  )
}
