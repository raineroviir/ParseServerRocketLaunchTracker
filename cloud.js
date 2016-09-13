// var Schedule = Parse.Object.extend('Schedule')
// var fetch = require('isomorphic-fetch')
//
// Parse.Cloud.define('test_push', function(request, response) {
//
//   var user = request.user
//   if (!user) {
//     return response.error({message: 'Not Logged in'})
//   }
//
//   var query = new Parse.Query(Parse.Installation)
//   query.equalTo('user', user)
//
//   var userName = user.get('name')
//   var data;
//   data = {
//     alert: 'Test notification for ' + userName
//   }
//
//   data.badge = 'Increment'
//
//   Parse.Push.send({
//     where: query,
//     push_time: new Date(Date.now() + 3000),
//     badge: 'Increment',
//     data: data,
//   }).then(
//     function() { response.success([]) },
//     function(error) { response.error(error) }
//   )
// })
//
// Parse.Cloud.define('sign-up', function(req, res) {
//   var user = new Parse.User()
//   user.set("email", req.params.email);
//   user.set("password", req.params.password);
//   user.set("username", req.params.username);
//   user.signUp(null, {
//     success: function(user) {
//       res.status(201).send('Signup Success!');
//     },
//     error: function(user, error) {
//       console.log(user)
//       console.log(error)
//       res.end('Error! Read server logs')
//     }
//   });
// })
//
// Parse.Cloud.define('schedule', function(req, res) {
//   let query = new Parse.Query(Schedule)
//   let expirationDate = new Date(Date.now() - 1500000)
//   let isDataOld = query.greaterThanOrEqualTo("createdAt", expirationDate).find().then(results => {
//     console.log(results)
//     if (results.length === 0) {
//       Parse.Cloud.httpRequest({
//         url: 'http://localhost:1337/api/reddit-launch-schedule'
//       })
//         .then(response => {
//           let updatedSchedule = new Schedule().save({
//               schedule: response.data
//             })
//           res.send(response.data)
//         })
//     }
//     let objectId = result[0].id
//     console.log(objectId)
//     let parsequery = new Parse.Query('Schedule')
//     parsequery.objectId
//     console.log(parsequery)
//     return parsequery
//   })
//   return isDataOld
//     // .then(body => {
//     //   let currentSchedule = new Schedule().save({
//     //     schedule: body,
//     //     fetchDate: Date.now()
//     //   })
//     //   console.log(currentSchedule)
//     //   return currentSchedule
//     // })
//   // }
// })
