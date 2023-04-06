import * as board_util from './board.js';

(function() {

var board;
var clicked_loc = null;
var legal_moves = null;
var moves = [];
var move_index = null;
var board_key_to_eval = {};
const player_id_to_color = {0: 'red', 1: 'blue', 2: 'yellow', 3: 'green'};
var request_interval = null;
var max_search_depth = null;

if (window.localStorage != null) {
  var max_depth = parseInt(window.localStorage['max_search_depth']);
  if (max_depth != null && !isNaN(max_depth)) {
    max_search_depth = max_depth;
  }
}

function createBoard() {
  var rows = []
  for (var row = 0; row < 14; row++) {
    var cols = []
    for (var col = 0; col < 14; col++) {
      var classes = ['cell'];
      if ((row < 3 && col < 3)
          || (row > 10 && col < 3)
          || (row > 10 && col > 10)
          || (row < 3 && col > 10)) {
        classes.push('blocked');
      } else if ((row + col) % 2 == 0) {
        classes.push('even');
      } else {
        classes.push('odd');
      }

      var class_str = classes.join(' ');
      var cell_id = `cell_${row}_${col}`;
      var cell = `<div class='${class_str}'
                       id='${cell_id}'
                       data-row='${row}'
                       data-col='${col}'>
                  </div>`;
      cols.push(cell);
    }
    var cols_html = cols.join('');
    var row_html = `<div class='row'>${cols_html}</div>`;
    rows.push(row_html);
  }

  rows = rows.join('\n');
  var board_html = `<div class='board-wrapper'>${rows}</div>`;

  $('#board').html(board_html);

  // Create move overlay
  var svg_html = `
    <svg id="move_svg" width="100%" height="100%"
         xmlns="http://www.w3.org/2000/svg">
    </svg>`;

  $('#move_overlay').html(svg_html);
}

createBoard();

$(document).ready(function() {
  resetBoard();
  displayBoard();
  request_interval = setInterval(requestBoardEvaluation, 50);
  if (max_search_depth != null) {
    $('#max_depth').val(max_search_depth);
  }
  $('#max_depth').change(function() {
    var max_depth = parseInt($(this).val());
    if (max_depth == null || isNaN(max_depth)) {
      max_search_depth = null;
    } else {
      max_search_depth = max_depth;
    }
    window.localStorage['max_search_depth'] = max_search_depth;
  });
})

function resetBoard() {
  board = board_util.Board.CreateStandardSetup();
  clicked_loc = null;
  legal_moves = null;
  moves = [];
  move_index = null;

//  setTimeout(executeDebugMoves, 0);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeDebugMoves() {
  function Loc(row, col) {
    return new board_util.BoardLocation(row, col);
  }

  function Move(from, to) {
    return board_util.Move.FromStandardMove(from, to);
  }

  var debug_moves = [
    Move(Loc(12, 7), Loc(11, 7)),
    Move(Loc(6, 1), Loc(6, 2)),
    Move(Loc(1, 9), Loc(3, 9)),
    Move(Loc(4, 12), Loc(4, 11)),
    Move(Loc(12, 5), Loc(11, 5)),
    Move(Loc(5, 0), Loc(6, 1)),
    Move(Loc(0, 8), Loc(5, 13)),
    Move(Loc(6, 13), Loc(5, 13)),
    Move(Loc(13, 8), Loc(6, 1)),
    Move(Loc(6, 0), Loc(6, 1)),
    Move(Loc(1, 6), Loc(2, 6)),
    Move(Loc(7, 12), Loc(7, 11)),
    Move(Loc(12, 6), Loc(11, 6)),
    Move(Loc(6, 1), Loc(0, 7)),
    Move(Loc(0, 6), Loc(0, 7)),
    Move(Loc(8, 13), Loc(7, 12)),
    Move(Loc(11, 7), Loc(10, 7)),
    Move(Loc(10, 1), Loc(10, 3)),
    Move(Loc(0, 5), Loc(7, 12)),
    Move(Loc(7, 13), Loc(7, 12)),
    Move(Loc(13, 5), Loc(9, 9)),
    Move(Loc(7, 1), Loc(7, 2)),
    Move(Loc(0, 4), Loc(2, 3)),
    Move(Loc(9, 13), Loc(10, 11)),
    Move(Loc(12, 10), Loc(11, 10)),
    Move(Loc(6, 2), Loc(6, 3)),
    Move(Loc(2, 3), Loc(4, 4)),
    Move(Loc(4, 13), Loc(5, 11)),
    Move(Loc(11, 10), Loc(10, 11)),
    Move(Loc(8, 0), Loc(4, 4)),
    Move(Loc(0, 9), Loc(2, 10)),
    Move(Loc(8, 12), Loc(8, 10)),
    Move(Loc(7, 12), Loc(3, 8)),
    Move(Loc(4, 4), Loc(5, 5)),
    Move(Loc(3, 9), Loc(4, 9)),
    Move(Loc(3, 8), Loc(9, 8)),
    Move(Loc(13, 4), Loc(12, 6)),
    Move(Loc(10, 0), Loc(10, 2)),
    Move(Loc(1, 8), Loc(3, 8)),
    Move(Loc(2, 10), Loc(3, 8)),
    Move(Loc(9, 9), Loc(5, 5)),
    Move(Loc(6, 3), Loc(6, 4)),
    Move(Loc(3, 8), Loc(5, 9)),
    Move(Loc(5, 11), Loc(3, 10)),
    Move(Loc(13, 10), Loc(11, 10)),
    Move(Loc(4, 0), Loc(3, 2)),
    Move(Loc(5, 9), Loc(3, 10)),
    Move(Loc(9, 8), Loc(11, 10)),
    Move(Loc(13, 6), Loc(10, 3)),
    Move(Loc(3, 2), Loc(4, 4)),
    Move(Loc(0, 7), Loc(1, 6)),
    Move(Loc(4, 11), Loc(3, 10)),
    Move(Loc(5, 5), Loc(4, 4)),
    Move(Loc(7, 2), Loc(7, 3)),
    Move(Loc(2, 6), Loc(3, 6)),
    Move(Loc(3, 13), Loc(4, 13)),
    Move(Loc(13, 9), Loc(11, 10)),
    Move(Loc(10, 2), Loc(10, 3)),
    Move(Loc(0, 10), Loc(0, 8)),
  ];

  function makeClick(loc) {
    var row = loc.getRow();
    var col = loc.getCol();
    var cell_id = `#cell_${row}_${col}`;
    $(cell_id).click();
  }

  for (const move of debug_moves) {
//    await sleep(500);

//    makeClick(move.getFrom());
//    await sleep(30);
//    makeClick(move.getTo());
//    await sleep(500);

    var piece = board.getPiece(move.getFrom());
    var pieceMoves = board.getMovesForPiece(piece, move.getFrom());
    var actualMove = null;
    for (const pm of pieceMoves) {
      if (pm.getTo().equals(move.getTo())) {
        actualMove = pm;
        break;
      }
    }
    if (actualMove == null) {
      throw new Error('incorrect move: ' + move);
    }

    board.makeMove(actualMove);
    var piece_type = piece.getPieceType();
    moves.push([actualMove, piece_type]);
    move_index = moves.length - 1;
    displayBoard();
    await sleep(50);

  }

}

function maybeUndoMove(jump = 1) {
  if (moves.length && move_index >= 0) {
    var num_undo = Math.min(jump, move_index + 1);
    move_index -= num_undo;
    for (var i = 0; i < num_undo; i++) {
      board.undoMove();
    }
    clicked_loc = null;
    legal_moves = null;
    displayBoard();
  }
}

function maybeRedoMove(jump = 1) {
  if (moves.length && move_index < moves.length - 1) {
    var num_redo = Math.min(jump, moves.length - move_index - 1);
    for (var i = 0; i < num_redo; i++) {
      var move, piece_type;
      [move, piece_type] = moves.at(move_index + i + 1);
      board.makeMove(move);
    }
    move_index += num_redo;
    clicked_loc = null;
    legal_moves = null;
    displayBoard();
  }
}

function maybeMakeSuggestedMove() {
  var board_key = getBoardKey();
  var eval_results = board_key_to_eval[board_key];
  if (eval_results != null && 'evaluation' in eval_results) {
    var turn = board.getTurn();
    var principal_variation = eval_results['principal_variation'];
    for (const key_id in principal_variation) {
      const pv = principal_variation[key_id];
      const color = player_id_to_color[pv['turn']];

      if (color != turn.getColor().name) {
        break;
      }

      const from = pv['from'];
      const to = pv['to'];
      const from_row = from['row'];
      const from_col = from['col'];
      const to_row = to['row'];
      const to_col = to['col'];

      var piece = board.getPieceRowCol(from_row, from_col);
      var from_loc = new board_util.BoardLocation(from_row, from_col);
      var legal_moves = board.getLegalMoves(piece, from_loc);
      var to_loc = new board_util.BoardLocation(to_row, to_col);
      for (const move of legal_moves) {
        if (move.getTo().equals(to_loc)) {

          board.makeMove(move);
          var piece_type = piece.getPieceType();
          moves.push([move, piece_type]);
          move_index = moves.length - 1;
          displayBoard();

          break;
        }
      }
    }
  }
}

$('.cell').click(function() {
  var row = $(this).data('row');
  var col = $(this).data('col');
  var loc = new board_util.BoardLocation(row, col);

  if (legal_moves != null) {
    for (const move of legal_moves) {
      if (move.getTo().equals(loc)) {
        if (moves.length > 0 && move_index < moves.length - 1) {
          moves.splice(move_index + 1);
        }
        var piece_type = board.getPiece(move.getFrom()).getPieceType();
        board.makeMove(move);
        moves.push([move, piece_type]);
        move_index = moves.length - 1;

        if (move.getEndsGame() == null) {
          var capture = move.getStandardCapture();
          if ((capture != null && capture.getPieceType().equals(board_util.KING))
              || board.getAllLegalMoves().length == 0) {
            move.setEndsGame(true);
          } else {
            move.setEndsGame(false);
          }
        }

        break;
      }
    }

    clicked_loc = null;
    legal_moves = null;

  } else {

    if (loc in board.location_to_piece) {
      var loc, piece;
      [loc, piece] = board.location_to_piece[loc];
      if (piece.getColor().equals(board.getTurn().getColor())) {
        legal_moves = board.getLegalMoves(piece, loc);
      }
      if (legal_moves == null || legal_moves.length == 0) {
        clicked_loc = null;
        legal_moves = null;
      }
    } else {
      clicked_loc = null;
      legal_moves = null;
    }
  }

  displayBoard();
})

var piece_classes = [];
Object.keys(board_util.PlayerColor).forEach(function(player_color) {
  var color_name = player_color.toLowerCase();
  Object.keys(board_util.PieceType).forEach(function(piece_type) {
    var piece_name = piece_type.toLowerCase();
    var class_name = `${color_name}-${piece_name}`;
    piece_classes.push(class_name);
  });
});
var piece_classes_str = piece_classes.join(' ');

// NOTE: This could be more efficient.
function displayBoard() {
  $('.cell').removeClass(piece_classes_str);

  Object.values(board.location_to_piece).forEach(function(loc_piece) {
    var loc, piece;
    [loc, piece] = loc_piece;
    var color_name = piece.getPlayer().getColor().name.toLowerCase();
    var piece_name = piece.getPieceType().name.toLowerCase();
    var row = loc.getRow();
    var col = loc.getCol();
    var cell_id = `cell_${row}_${col}`;
    var class_name = `${color_name}-${piece_name}`;
    $(`#${cell_id}`).addClass(class_name);
  });

  const legal_move_indicator_class = 'legal-move-indicator';
  const legal_capture_indicator_class = 'legal-capture-indicator';
  $(`.${legal_move_indicator_class}`).removeClass(`${legal_move_indicator_class}`);
  $(`.${legal_capture_indicator_class}`).removeClass(`${legal_capture_indicator_class}`);

  if (legal_moves != null) {
    legal_moves.forEach(function(move) {
      var to = move.getTo();
      var row = to.getRow();
      var col = to.getCol();
      var cell_id = `#cell_${row}_${col}`;
      if (to in board.location_to_piece) {
        $(cell_id).append(`<div class='${legal_capture_indicator_class}'></div>`);
      } else {
        $(cell_id).append(`<div class='${legal_move_indicator_class}'></div>`);
      }
    });
  }

  if (moves.length > 0) {
    var elements = [];
    var colors = ['red', 'blue', 'yellow', 'green'];
    for (var move_id = 0; move_id < moves.length; move_id++) {
      var move, piece_type;
      [move, piece_type] = moves.at(move_id);
      var color = colors[move_id % 4];
      var cell_text = getMoveText(move, piece_type);
      if (move.getEndsGame() == true) {
        cell_text += '#';
      }
      var classes = ['move-cell', color];
      if (move_index == move_id) {
        classes.push('move-current');
      }
      var element_class = classes.join(' ');
      var element = `<div class='${element_class}'>${cell_text}</div>`;
      elements.push(element)
    }
    var row_elements = [];
    for (var move = 0; move < Math.ceil(elements.length / 4); move++) {
      var cells = [];
      cells.push(`<div class='move-number'>${move+1}</div>`);
      for (var index = move*4; index < (move+1)*4 && index < elements.length; index++) {
        cells.push(elements.at(index));
      }
      cells = cells.join('');
      var row_element = `<div class='move-row'>${cells}</div>`;
      row_elements.push(row_element);
    }
    var move_html = row_elements.join('\n');
    $('#move_history').html(move_html);
  }

  var board_key = getBoardKey();
  var eval_results = board_key_to_eval[board_key];
  if (eval_results != null && 'evaluation' in eval_results) {
    var evaluation = parseFloat(eval_results['evaluation']);
    var zero_move_evaluation = parseFloat(eval_results['zero_move_evaluation']);
    var eval_formatted = Number(evaluation).toFixed(1);
    var zero_move_formatted = Number(zero_move_evaluation).toFixed(1);
    var search_depth = eval_results['search_depth'];
    var eval_html = `eval: ${eval_formatted}    depth: ${search_depth}    zero-move eval: ${zero_move_formatted}`;
    $('#eval_estimate').html(eval_html);

    var svg_parts = [];
    for (const color of ['red', 'blue', 'yellow', 'green']) {
      svg_parts.push(`
        <defs>
          <!-- A marker to be used as an arrowhead -->
          <marker
            id="arrow-${color}"
            fill="${color}"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="3"
            markerHeight="3"
            orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>

        </defs>`);
    }

    var principal_variation = eval_results['principal_variation'];
    var move_overlay = document.getElementById('move_overlay');
    var overlay_rect = move_overlay.getBoundingClientRect();
    for (const key_id in principal_variation) {
      const pv = principal_variation[key_id];
      const turn = pv['turn'];
      const color = player_id_to_color[turn];
      const from = pv['from'];
      const to = pv['to'];
      const from_row = from['row'];
      const from_col = from['col'];
      const from_cell = document.getElementById(`cell_${from_row}_${from_col}`);
      const to_row = to['row'];
      const to_col = to['col'];
      const to_cell = document.getElementById(`cell_${to_row}_${to_col}`);

      const from_rect = from_cell.getBoundingClientRect();
      const to_rect = to_cell.getBoundingClientRect();

      const from_x = from_rect.x - overlay_rect.x + from_rect.width / 2;
      const from_y = from_rect.y - overlay_rect.y + from_rect.height / 2;

      const to_x = to_rect.x - overlay_rect.x + to_rect.width / 2;
      const to_y = to_rect.y - overlay_rect.y + to_rect.height / 2;

      const pv_html = `
        <line
          x1="${from_x}"
          y1="${from_y}"
          x2="${to_x}"
          y2="${to_y}"
          stroke="${color}"
          stroke-width="8"
          opacity="0.3"
          marker-end="url(#arrow-${color})"
          />
        `;

      svg_parts.push(pv_html);
    }

    var svg_html = svg_parts.join('\n');
    $('#move_svg').html(svg_html);
  } else {
    $('#move_svg').html('');
  }
}

function getMoveText(move, piece_type) {
  var to = move.getTo();
  var row = to.getRow();
  var col = to.getCol();
  const col_names = [
    'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n'];
  const row_names = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  var row_name = row_names.at(row);
  var col_name = col_names.at(col);
  var piece_name = piece_type.short_name;
  return `${piece_name}${col_name}${row_name}`;
}

$("body").keydown(function(e) {
  if(e.keyCode == 37) { // left
    maybeUndoMove();
  } else if (e.keyCode == 39) { // right
    maybeRedoMove();
  } else if (e.keyCode == 38) { // up
    maybeUndoMove(4);
  } else if (e.keyCode == 40) { // down
    maybeRedoMove(4);
  } else if (e.keyCode == 32) { // space
    maybeMakeSuggestedMove();
  }
});

$('#undo_move').click(function() {
  maybeUndoMove();
});

$('#redo_move').click(function() {
  maybeRedoMove();
});

//var request_in_flight = false;
var requests_in_flight = {}; // key -> requested search depth
var last_board_key = null;
//var next_depth = 1;
var controller = new AbortController();
var signal = controller.signal;

function getBoardState() {
  var state = {};
  state['turn'] = board.turn.getColor().name;
  state['board'] = [];
  for (let key in board.location_to_piece) {
    var loc, piece;
    [loc, piece] = board.location_to_piece[key];
    var item = {
      'row': loc.getRow(),
      'col': loc.getCol(),
      'pieceType': piece.getPieceType().name,
      'color': piece.getColor().name,
    };
    state['board'].push(item);
  }
  state['castling_rights'] = {};
  var players = [
      board_util.kRedPlayer,
      board_util.kBluePlayer,
      board_util.kYellowPlayer,
      board_util.kGreenPlayer];
  for (var i = 0; i < players.length; i++) {
    var player = players.at(i);
    var rights = board.castling_rights[player];
    var item = {
      'kingside': rights.getKingside(),
      'queenside': rights.getQueenside(),
    };
    state['castling_rights'][player.getColor().name] = item;
  }
  return state;
}

function getBoardKey() {
  return board.moves.toString();
}

function handleResponse(req_key, req_depth, data) {
  //request_in_flight = false;
  if (req_key in requests_in_flight) {
    var depth = requests_in_flight[req_key];
    if (depth <= req_depth) {
      delete requests_in_flight[req_key];
    }
  }
  if (data != null && 'evaluation' in data) {
    board_key_to_eval[req_key] = data;
    displayBoard();
  }
}

function handleError(req_key, req_depth, error) {
  //request_in_flight = false;
  if (req_key in requests_in_flight) {
    var depth = requests_in_flight[req_key];
    if (depth <= req_depth) {
      delete requests_in_flight[req_key];
    }
  }
}

function requestBoardEvaluation() {
  var req_key = getBoardKey();
  var req_pending = (req_key in requests_in_flight);

  if (!req_pending || req_key != last_board_key) {
    if (req_pending) {
      controller.abort();  // cancel current request
      controller = new AbortController();
      signal = controller.signal;
    }

    var eval_results = board_key_to_eval[req_key];

//    var search_depth = 10;

    var search_depth = 1;
    if (eval_results != null && 'search_depth' in eval_results) {
      search_depth = eval_results['search_depth'] + 1;
    }

    var board_state = getBoardState();
    var req_body = {
      'board_state': board_state,
      'search_depth': search_depth,
    }
    var req_text = JSON.stringify(req_body);
    // create a new request
    var options = {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: req_text,
      signal: signal,
    }

    if (max_search_depth != null && search_depth > max_search_depth) {
      return;
    }

    requests_in_flight[req_key] = search_depth;
    last_board_key = req_key;
    fetch('/chess-api', options)
      .then((response) => response.json())
      .then((response) => { handleResponse(req_key, search_depth, response); })
      .catch((response) => { handleError(req_key, search_depth, response); });
  }
}

})()

