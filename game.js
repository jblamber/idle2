(function() {

var module = angular.module("increment", ['angular-terminal'])

window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function(/* function */ callback, /* DOMElement */ element){
            window.setTimeout(callback, 1000 / 60);
        };
})();
var props = Object.entries || function(obj) { console.error("Entries method not supported")};
function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    if (bytes === 0) return '0';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    if (i === 0) return bytes.toFixed(0) + ' ' + sizes[i];
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

function kb(amt) {
    return amt*1024
}

function mb(amt) {
    return amt*kb(1024)
}

function gb(amt) {
    return amt*mb(1024)
}

function tb(amt) {
    return amt*gb(1024)
}

//Set the frame rate
var fps = 60,
    //Get the start time
    start = Date.now();

module.controller("IncrementalCtrl", ["$scope","$interval", "$timeout", "$rootScope",
                                    function($scope, $interval, $timeout, $rootScope) {
    // Basic variable declaration - keep track of how many of each
    // item we currently own, and how much the new ones should cost.
    var paused = false;

    $scope.currencies = {
        "cr": {amount:50, capacity : -1},
        "data" : {amount:0, capacity: mb(2)},
        "uploaded" : {amount:0, capacity: mb(2)}
    };

    $scope.purchaseables = [
        {verb:"Add Auto Script", cost: {"cr":0, "data": 10}, costScale: 1.1,  consumeS: {}, produceS : {"data": 2}, amount: 0},
        {verb:"Build Program", cost: {"cr":10, "data": 15}, costScale: 1.1, consumeS: {"data": 4}, produceS : {"uploaded": 3}, amount: 0},
        {verb:"Install Backdoor", cost: {"cr":50, "data": kb(1)}, costScale: 1.2, consumeS: {},  produceS : {"data": 1000}, amount: 0},
    ];

    $scope.consumers = [
        {name:"Users", consumeS: { "uploaded": 10} , producesS: {"cr": 0.1 } , amount: 0}
    ];

    $scope.heros = [

    ];

    $scope.villians = [

    ];


    $scope.bytes = function(bytes) {
        return bytesToSize(bytes);
    };

    function consumeProduce(objEntity, elapsed) {
        if (objEntity.amount > 0) {

            var unitsCanAffordCost = objEntity.amount;
            props(objEntity.consumeS).map(function(c) {
                var unitCost = ((elapsed / 1000) *  c[1]);
                unitsCanAffordCost = Math.min(Math.floor($scope.currencies[c[0]].amount / unitCost), objEntity.amount )
            });

            if (unitsCanAffordCost) { //pay cost, create resources
                props(objEntity.consumeS).map(function (c) {
                    var unitCost = ((elapsed / 1000) *  c[1]);
                    $scope.currencies[c[0]].amount -=  unitCost * unitsCanAffordCost
                });
                props(objEntity.produceS).map(function (r) {
                    var unitProduction = ((elapsed / 1000) * r[1]);
                    $scope.currencies[r[0]].amount += unitProduction * unitsCanAffordCost;
                    if ($scope.currencies[r[0]].capacity > 0 && $scope.currencies[r[0]].amount > $scope.currencies[r[0]].capacity) {
                        $scope.currencies[r[0]].amount = $scope.currencies[r[0]].capacity;
                    }
                });
            }
        }
    }


    function update() {
        if(!paused){
            var current = Date.now(),
                elapsed = current - start;
            start = current;

            requestAnimFrame( update );

            $scope.purchaseables.map(function(entity){
                consumeProduce(entity, elapsed)
            });

            $scope.consumers.map(function(entity){
                consumeProduce(entity, elapsed)
            });

            $scope.$apply();
        }
    }

    $scope.canPurchase = function(entity) {

        var purchasable = true;
        props(entity.cost).map(function(type) {
            if ($scope.currencies[type[0]].amount < type[1])
            {
                purchasable = false;
            }
        });
        return purchasable

    };

    $scope.canShow = function(entity, ratio) {
        if (entity.amount > 0 && entity.seen === true)
            return true;

        var purchasable = true;
        props(entity.cost).map(function(type) {
            if ($scope.currencies[type[0]].amount < (type[1] * ratio))
            {
                purchasable = false;
            }
        });

        if (purchasable) {
            entity.seen = true;
        }

        return purchasable

    };

    $scope.purchase = function(entity) {
        if ($scope.canPurchase(entity)) {
            entity.amount+=1;
            props($scope.currencies).map(function(c){
                if (typeof entity.cost[c[0]] !== 'undefined') {
                    $scope.currencies[c[0]].amount -= entity.cost[c[0]];
                    entity.cost[c[0]] *= entity.costScale;
                }
            });
        }
    };


    /*$rootScope.$on('terminal.main', function (e, input, terminal) {
    // manipulate input
    // `terminal` object is also available for additional manipulation
    });

    $timeout(function() {
            $rootScope.$emit('terminal.main.echo', 'Hello World');
        }, 200)*/
    

    $scope.compute = function() {
        $scope.currencies['data'].amount+=1;
    };


    requestAnimFrame( update );
}])

module.directive("cost", [ function() {
    return {
        restrict: 'E',
        scope: {
            entity : '=',
        },
        templateUrl: 'views/common/cost.html',
        controller: function ($scope
        ) {

            $scope.bytes = function(bytes) {
                return bytesToSize(bytes);
            };

        }
    }
}])


}()) //namespace