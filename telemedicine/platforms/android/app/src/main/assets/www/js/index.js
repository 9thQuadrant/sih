var initial = angular
                .module('teleMed', ['ngRoute','btford.socket-io','swipe'])
                .factory('socket',  (socketFactory) => {


                    try{
                        registrationCat = JSON.parse(localStorage.reg);
                        if(registrationCat.cat == 'doc')
                            var ioSocket = io('http://192.168.2.6:3333/doc?namespace='+registrationCat.id);
                        else if(registrationCat.cat == 'rmp')
                            var ioSocket = io('http://192.168.2.6:3333/rmp?namespace='+registrationCat.id);
                    }
                    catch(e){
                        var ioSocket = io('http://192.168.0.105:3333/reg');
                    }

                    return socketFactory({

                        prefix: '',
                        ioSocket: ioSocket,

                    });

                })
                .service('initService',['ngAnimate'])
                .run( ($rootScope ) => {
                    $rootScope.registrationCat = {};
                    $rootScope.titleBar = true;
                    $rootScope.warning = true;
                    $rootScope.titleCall = false;
                    $rootScope.backButton = false;
                    $rootScope.callScreen = false;
                    $rootScope.selectCategory = false;
                    $rootScope.mainList = false;
                    $rootScope.settings = false;
                    $rootScope.loading = false;
                    $rootScope.addNew = false;
                    $rootScope.emptyList = false;
                    $rootScope.addNewScreen = false;
                    $rootScope.chatWindow = false;
                    $rootScope.title = 'Tele Medicine';
                    $rootScope.listTemp = [];
                });

initial.directive('scrollToLast', ['$location', '$anchorScroll', function($location, $anchorScroll){

    return {
        restrict: 'AE',
        scope: {},
        link: (scope, element, attrs) => {
            $location.hash(attrs.scrollToLast);
            $anchorScroll();
        }
    };

}]);

initial.filter('styleAadharFilter', ()=> {
    return (patAadhar)=>{
        if(patAadhar)
            return patAadhar.replace(/ /gi, '').replace(/(\d{4})/g, '$1 ');
    }
});

initial.controller('initController', ($scope, $rootScope,$timeout ,socket) => {

    $scope.init = () => {
        reg = localStorage.reg;
        reg = reg?reg:'';
        if(reg)
        {
            $rootScope.registrationCat = JSON.parse(localStorage.reg);
            $scope.initLoad();
        }
        else
        {

            $timeout( () => {
                $rootScope.selectCategory = true;
                $rootScope.mainList = $rootScope.settings = false;
            } , 500);
        }
        

    };

    $scope.initLoad = ()=>{

        socket.on('callInit', (callData) =>{
            console.log(callData);
            callData.incoming = true;
            $rootScope.$emit('callScreenControllerInit' , callData);
        });

        socket.on('emergencyCall', (callData) =>{
            console.log(callData);
            callData.incoming = true;
            callData.aadhar = 'emergency';
            $rootScope.$emit('callScreenControllerInit' , callData);
        });

        socket.on('callEnd',(data)=> {
            $rootScope.$emit('callScreenControllerCallEnd' , data);
        });


ss(socket).on('audioStream', function(stream, data, callback) {
    console.log(stream);
});
        socket.on('audioStream',(data)=> {
            console.log(data);
            console.log(window.URL.createObjectURL(data.stream));
            $rootScope.$emit('callScreenControllerAudioStream',window.URL.createObjectURL(data.stream));
        });


        socket.on('receiveMessage', (messageData) =>{

            console.log(messageData,'receiveMessage');
            aadharList = localStorage.patAadharList?JSON.parse(localStorage.patAadharList):[];
            console.log(aadharList);

            aadharList.length == 0
                ?   aadharList[0]=messageData.aadhar
                :   (!aadharList.includes(messageData.aadhar) ? aadharList.push(messageData.aadhar) : '' );

                aadharJSON = localStorage.getItem('i'+messageData.aadhar)
                ?   JSON.parse(localStorage.getItem('i'+messageData.aadhar))
                :   [];

                if(aadharJSON.length == 0)
                    aadharJSON.push({
                        name    : messageData.name,
                        aadhar  : messageData.aadhar,
                        chat    : '',
                        doctor  : messageData.sender_id
                    });                

                /* first iteration */
                if(!aadharJSON[0].chat)
                    aadharJSON[0].chat = [{
                        from    : $rootScope.registrationCat.cat == 'rmp'?'doc':'rmp',
                        message : messageData.message,
                        date    : messageData.date,
                        to      : messageData.sender_id,
                    }];

                else
                    aadharJSON[0].chat.push({
                        from    : $rootScope.registrationCat.cat == 'rmp'?'doc':'rmp',
                        message : messageData.message,
                        date    : messageData.date,
                        to      : messageData.sender_id,
                    });

                localStorage.setItem('i'+messageData.aadhar,JSON.stringify(aadharJSON));

            localStorage.patAadharList = JSON.stringify(aadharList);

            $scope.generateList();
            $rootScope.$emit('chatWindowControllerConversationUpdate',messageData.aadhar);

        });

        $timeout(function() {
            socket.emit('checkForUnread', {id : $rootScope.registrationCat.id });
        }, 2000);


            $scope.generateList = ()=>{
                $rootScope.listTemp = [];
                if($rootScope.innerList)
                    JSON.parse(localStorage.patAadharList).forEach( (aadharInstance) => {
                        $rootScope.listTemp.push(JSON.parse(localStorage.getItem('i'+aadharInstance)));
                    });
            }

            $rootScope.selectCategory = false;
            $rootScope.settings = true;
            $rootScope.mainList =true;
            $rootScope.addNew = JSON.parse(localStorage.reg).cat == 'rmp'?true:false;
            $rootScope.loading = false;
            $rootScope.emptyList = localStorage.patAadharList?false:true;
            $rootScope.innerList = !$rootScope.emptyList;
            $scope.generateList();

    }

    $scope.gotoRegistration = (category) =>{
        console.log(category);
        $rootScope.registration = true;
        $rootScope.selectCategory = false;
        $rootScope.category = category;
        $rootScope.title = 'Register';
    }

});


initial.controller("registration", ($scope, $rootScope, $http ,$timeout , socket) => {

    $scope.send = () => {
        console.log($scope.category);
        $rootScope.loading = true;

        if($scope.category == 'doc')
            socket.emit('newReg',{
                cat : 'doc',
                name : $scope.rmp,
                empId : $scope.mainId,
            });
        else if ($scope.category == 'rmp')
            socket.emit('newReg',{
                cat : 'rmp',
                nodalId : $scope.mainId,
                state : $scope.state,
                rmp : $scope.rmp,
            });
        socket.on('newRegResp',(data)=>{
            console.log(data);
            // return;
            localStorage.reg = JSON.stringify({
                cat : $scope.category,
                id  : data[0].id,
                name : $scope.rmp,
            });
            window.location.reload();
            socket.removeListener('newRegResp');
        });

    }

    $scope.goBack = () => {
            $rootScope.registration = false;
            $rootScope.selectCategory = true;
            $rootScope.title = 'Tele Medicine';
    };

    $(document)
        .on("deviceready", () =>{
        $(document).off("backbutton");
        $(document).on("backbutton", () =>{
            console.log("backbutton");
            $scope.goBack();
            $scope.$apply();
            $(document).off("backbutton");
        })
    });

});

initial.controller('mainListController', ($scope, $rootScope , socket) => {

    $scope.gotoChatWindow = (patAadhar) => {
        $rootScope.$emit("chatWindowControllerInit", patAadhar);
    }

    $scope.newEntry = () =>{
        $rootScope.addNew = false;
        $rootScope.emptyList = $rootScope.innerList = false;
        $rootScope.title = 'Add New Patient';
        $rootScope.addNewScreen = true;
    };
    $scope.generateList = (e)=>{    
        return $rootScope.listTemp;
    };

    $scope.callDoctor = (patAadhar) => {
        $rootScope.$emit('callScreenControllerInit' , {
            aadhar   : patAadhar,
            id       : JSON.parse(localStorage.getItem('i'+patAadhar))[0].doctor,
            name     : JSON.parse(localStorage.getItem('i'+patAadhar))[0].doctor,  //TO-DO doctor name
            incoming : false,
        } );
    }

    $scope.sendNewPatient = (patAadhar) => {

        patAadhar = patAadhar.replace(/ /gi, '');
        patAadharList = [];
        patAadharDetails = [];
        if(localStorage.patAadharList)
            patAadharList = JSON.parse(localStorage.patAadharList);
        if(!patAadharList.includes(patAadhar))
            patAadharList.push(patAadhar);
        localStorage.patAadharList = JSON.stringify(patAadharList);

        if(!localStorage.getItem('i'+ patAadhar)){

            patAadharDetails.push({

                name    : $scope.patName,
                aadhar  : patAadhar,
                chat    : '',
                doctor  : 33,

            });

            localStorage.setItem('i'+ patAadhar ,JSON.stringify(patAadharDetails));
        }

        $rootScope.addNewScreen = false;
        $rootScope.chatWindow = true;
        $rootScope.$emit("chatWindowControllerInit", patAadhar);
    };

    $scope.styleAadhar = (patAadhar)=>{
        $scope.patAadhar = patAadhar.replace(/\W/g,'').replace(/ /gi, '').replace(/(\d{4})/g, '$1 ');
    };

    $scope.cordovaOnChange = (patAadhar) => {
        $scope.styleAadhar(patAadhar);
        $scope.checkLengthAadhar(patAadhar);
    };

    $scope.checkLengthAadhar = (patAadhar)=>{
        $scope.patName = '';
        $scope.patAadharValid = patAadhar.replace(/ /gi, '').length == 12 ? true:false;
        if($scope.patAadharValid){

            socket.emit('checkAadhar',{
                aadhar : patAadhar.replace(/ /gi, '')
            });

            socket.on('checkAadhar', data => {
                console.log(data[0]);
                if(data[0].name || data[0])
                    $scope.patName = data[0].name;
                else
                    $scope.patName = JSON.parse(localStorage.getItem('i'+patAadhar.replace(/ /gi, '')))[0].name;

                socket.removeListener('checkAadhar');
            });

        }
    };


});

initial.controller('chatWindowController', ($scope, $rootScope, $http ,$timeout ,$location, socket) => {

    $(document)
        .on("deviceready", () =>{
        $(document).off("backbutton");
        $(document).on("backbutton", () =>{
            console.log("backbutton");
            $scope.gotoMainScreen();
            $scope.$apply();
            $(document).off("backbutton");
        })
    });

    $rootScope.$on('titleBarBackButton',(e)=>{
        $scope.gotoMainScreen();
    });


    $scope.gotoMainScreen  = ()=>{
        $rootScope.backButton = false;
        $rootScope.mainList = true;
        $rootScope.chatWindow = false;
        $rootScope.titleCall = false;
        $rootScope.warning = true;
        $rootScope.title = 'Tele Medicine';
        $location.url($location.path());     
    };


    $rootScope.$on('chatWindowControllerInit',(e,patAadhar)=>{
        $rootScope.backButton = true;
        $rootScope.mainList = false;
        $rootScope.chatWindow = true;
        $rootScope.titleCall = true;
        $rootScope.warning = false;
        $scope.patAadharCurrent = patAadhar.replace(/ /gi, '');
        $rootScope.title = patAadhar.replace(/ /gi, '').replace(/(\d{4})/g, '$1 ');
        $scope.getConversation(patAadhar.replace(/ /gi, ''));
    });

    $rootScope.$on('chatWindowControllerConversationUpdate',(e,patAadhar) => {
        if($scope.patAadharCurrent == patAadhar)
            $scope.getConversation(patAadhar);
    });

    $scope.getConversation = (patAadhar) =>{
        aadharJSON = JSON.parse(localStorage.getItem('i'+patAadhar));
        $scope.conversation = aadharJSON[0].chat;
    };

    $scope.sendMessage = () => {

        aadharJSON = JSON.parse(localStorage.getItem('i'+$scope.patAadharCurrent));
        if(!aadharJSON[0].chat)
            aadharJSON[0].chat = [{
                from    : $rootScope.registrationCat.cat ,
                message : $scope.chatMessage,
                date    : new Date(),
                to      : aadharJSON[0].doctor,
                sent    : false,
            }];
        else
            aadharJSON[0].chat.push({
                from    : $rootScope.registrationCat.cat,
                message : $scope.chatMessage,
                date    : new Date(),
                to      : aadharJSON[0].doctor,
                sent    : false
            });

        socket.emit('sendMessage',{
                from        : $rootScope.registrationCat.cat,
                sender_id   : $rootScope.registrationCat.id,
                message     : $scope.chatMessage,
                to          : aadharJSON[0].doctor,
                unread      : true,
                aadhar      : $scope.patAadharCurrent,
                date        : new Date(),
                name        : aadharJSON[0].name
            });



        $scope.chatMessage = '';
        localStorage.setItem('i'+$scope.patAadharCurrent,JSON.stringify(aadharJSON));
        $scope.getConversation($scope.patAadharCurrent);

    }

});

initial.controller("titleBarController", ($scope, $rootScope, $http ,$timeout ) =>{

    $scope.gotoMainScreen = () =>{
        $rootScope.$emit("titleBarBackButton", {});
    };

});

initial.controller('callScreenController', ($scope, $rootScope, $http ,$timeout , socket) =>{

    $rootScope.$on('callScreenControllerInit' , (e,patAadhar)=>{
        $(document).on('backbutton').off();
        $scope.callTimer = false;
        $rootScope.callScreen = true;
        $rootScope.addNew =  false;
        console.log(patAadhar);
        if(patAadhar.incoming == true){
            $scope.callAnswer = true;
            $scope.id = patAadhar.id;
            $scope.doctor = patAadhar.name;
            $scope.callAnswer = true;
        }else{
            $scope.id = patAadhar.id;
            $scope.callAnswer = false;
            $scope.speciality = patAadhar.aadhar;
            $scope.doctor = patAadhar.doc;
            $scope.callInit(patAadhar);
        }
    });

    $rootScope.$on('callScreenControllerAudioStream',(e,stream)=>{
        $scope.audio = stream;
    });
    $rootScope.$on('callScreenControllerCallEnd' , (e)=>{
        $rootScope.callScreen = false;
        $rootScope.addNew =  true;
    });

    $scope.answerCall = (e,id) => {
        console.log("answerCall");
        navigator.mediaDevices.getUserMedia({
            'audio': true,
            'video': false
        }).then( (audioStream) =>{
            //audioStream = new webkitMediaStream(audioStream);
            console.log(window.URL.createObjectURL(audioStream));

            var stream = ss.createStream();
            ss(socket).emit('sendStream', stream, {id: id});
            ss.createBlobReadStream(audioStream).pipe(stream);

        }).catch(e => {
            console.log(e);
        });
 
    };

    $scope.callEnd = (id) => {
        console.log("callEnd" , id);
        socket.emit('callEnd',{to: id.id});
        $rootScope.callScreen = false;
        $rootScope.addNew =  true;
    };

    $scope.callInit = (patAadhar) =>{
        console.log(patAadhar);
        socket.emit('callInit' , {
            aadhar : patAadhar.aadhar,
            name   : patAadhar.name,
            id     : $rootScope.registrationCat.id,
            to     : patAadhar.id
        });
    }


});


$(document).ready(function() {
    $('select').material_select();
});