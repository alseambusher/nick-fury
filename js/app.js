// constants ---------------------------------------------

// game state constants
const cGameStopped = 0;
const cGameStarted = 1;
const cGamePaused = 2;

const cMaxGameSpeed = 5;

//points
const T = "TopCenter";
const B = "BottomCenter";
const L = "LeftMiddle";
const R = "RightMiddle";


// globals -----------------------------------------------
var G_GAME_SPEED = 1;
var G_GAME_STATE = cGameStopped;
var G_NUM_TILES = 0;

// game settings -----------------------------------------
var game_connections = { 6: [[1,3,R,L],
			[2,3,R,L],
			[3,4,R,L],
			[3,5,R,L],
			[4,6,R,L],
			[5,6,R,L]] };

// left and top positions of the window in %
var window_positions = { 6: [[10,10],
			     [10,50],	
			     [30,25],	
			     [50,10],	
			     [50,50],	
			     [70,25]]};


$(document).ready(function(){
    	G_NUM_TILES = parseInt($("#num_tiles").html());
	// set num tiles
	$(".num_tiles_selector").click(function(){
		G_NUM_TILES = parseInt($(this).html().split(" ")[1]);
		$("#num_tiles").html(G_NUM_TILES);
	});

	// set game speed
	$("#game_speed_button").click(function(){
		G_GAME_SPEED = ((G_GAME_SPEED+1) % (cMaxGameSpeed+1));
		if (!G_GAME_SPEED) G_GAME_SPEED = 1;
		$("#game_speed").html(G_GAME_SPEED);
	});

	$("#start_game_button").click(start);

});



// display progress alternates between two states
var _state = true;
function displayProgress(){
	// TODO do this only for active windows
	if(_state)
		$(".window").css('box-shadow', '2px 2px 19px #e0e0e0');
	else
		$(".window").css('box-shadow', '2px 2px 19px red');

	_state = !_state;

	if(G_GAME_STATE == cGameStarted)
		setTimeout(displayProgress, 1000/G_GAME_SPEED);
}

function start() {
    var instance = jsPlumb.getInstance({
        // default drag options
        DragOptions: { cursor: 'pointer', zIndex: 2000 },
        // the overlays to decorate each connection with.  note that the label overlay uses a function to generate the label text; in this
        // case it returns the 'labelText' member that we set on each connection in the 'init' method below.
        ConnectionOverlays: [
            [ "Arrow", { location: 1 } ],
        ],
        Container: "flowchart-demo"
    });

    var basicType = {
        connector: "StateMachine",
        paintStyle: { strokeStyle: "red", lineWidth: 4 },
        hoverPaintStyle: { strokeStyle: "blue" },
        overlays: [
            "Arrow"
        ]
    };
    instance.registerConnectionType("basic", basicType);

    // this is the paint style for the connecting lines..
    var connectorPaintStyle = {
            lineWidth: 4,
            strokeStyle: "#61B7CF",
            joinstyle: "round",
            outlineColor: "white",
            outlineWidth: 2
        },
    // .. and this is the hover style.
        connectorHoverStyle = {
            lineWidth: 4,
            strokeStyle: "#216477",
            outlineWidth: 2,
            outlineColor: "white"
        },
        endpointHoverStyle = {
            fillStyle: "#216477",
            strokeStyle: "#216477"
        },
    // the definition of source endpoints (the small blue ones)
        sourceEndpoint = {
            endpoint: "Dot",
            paintStyle: {
                strokeStyle: "#7AB02C",
                fillStyle: "transparent",
                radius: 7,
                lineWidth: 3
            },
            isSource: true,
            connector: [ "Flowchart", { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true } ],
            connectorStyle: connectorPaintStyle,
            hoverPaintStyle: endpointHoverStyle,
            connectorHoverStyle: connectorHoverStyle,
            dragOptions: {},
            overlays: [
                [ "Label", {
                    location: [0.5, 1.5],
                    label: "Drag",
                    cssClass: "endpointSourceLabel"
                } ]
            ]
        },
    // the definition of target endpoints (will appear when the user drags a connection)
        targetEndpoint = {
            endpoint: "Dot",
            paintStyle: { fillStyle: "#7AB02C", radius: 11 },
            hoverPaintStyle: endpointHoverStyle,
            maxConnections: -1,
            dropOptions: { hoverClass: "hover", activeClass: "active" },
            isTarget: true,
            overlays: [
                [ "Label", { location: [0.5, -0.5], label: "Drop", cssClass: "endpointTargetLabel" } ]
            ]
        },
        init = function (connection) {
            connection.getOverlay("label").setLabel(connection.sourceId.substring(15) + "-" + connection.targetId.substring(15));
        };

    var _addEndpoints = function (toId, sourceAnchors, targetAnchors) {
        for (var i = 0; i < sourceAnchors.length; i++) {
            var sourceUUID = toId + sourceAnchors[i];
            instance.addEndpoint("flowchart" + toId, sourceEndpoint, { anchor: sourceAnchors[i], uuid: sourceUUID });
        }
        for (var j = 0; j < targetAnchors.length; j++) {
            var targetUUID = toId + targetAnchors[j];
            instance.addEndpoint("flowchart" + toId, targetEndpoint, { anchor: targetAnchors[j], uuid: targetUUID });
        }
    };

    // set window positions
    for (var i=1; i<=G_NUM_TILES; i++){
    	node = window_positions[G_NUM_TILES][i-1];
	$("#flowchartWindow"+i).css('left', node[0]+"%");
	$("#flowchartWindow"+i).css('top', node[1]+"%");
    }
    // suspend drawing and initialise.
    instance.batch(function () {

	for(var i=0; i<G_NUM_TILES; i++){
		node = game_connections[G_NUM_TILES][i];
        	_addEndpoints("Window"+node[0], [node[2]], []);
        	_addEndpoints("Window"+node[1], [], [node[3]]);
	}

        // listen for new connections; initialise them the same way we initialise the connections at startup.
        instance.bind("connection", function (connInfo, originalEvent) {
            init(connInfo.connection);
        });

        jsPlumb.draggable(document.querySelectorAll(".window"), { grid: [20, 20] });

        // connect the tiles
	for(var i=0; i<G_NUM_TILES; i++){
		node = game_connections[G_NUM_TILES][i];
        	instance.connect({uuids: ["Window"+node[0]+node[2], "Window"+node[1]+node[3]], editable: false});
	}

        //
        // listen for clicks on connections, and offer to delete connections on click.
        //
        instance.bind("click", function (conn, originalEvent) {
           // if (confirm("Delete connection from " + conn.sourceId + " to " + conn.targetId + "?"))
             //   instance.detach(conn);
            conn.toggleType("basic");
        });

        instance.bind("connectionDrag", function (connection) {
            console.log("connection " + connection.id + " is being dragged. suspendedElement is ", connection.suspendedElement, " of type ", connection.suspendedElementType);
        });

        instance.bind("connectionDragStop", function (connection) {
            console.log("connection " + connection.id + " was dragged");
        });

        instance.bind("connectionMoved", function (params) {
            console.log("connection " + params.connection.id + " was moved");
        });
    });

    jsPlumb.fire("jsPlumbDemoLoaded", instance);

    // set flag of game state
    G_GAME_STATE = cGameStarted;
    displayProgress();
}
