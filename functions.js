var mouse_x = 0;
var mouse_y = 0;

const canvas = document.getElementById ("gameCanvas");
const ctx = canvas.getContext ("2d");
const width = canvas.width;
const size = width/8;
const draw_size = 0.95*size;
const delta_size = (size-draw_size)/2;

const black_col = 0xb96e2d;
const white_col = 0xebcaad;
const possible_moves_col = 0xbb2a2a;
const outline_col = 0x222222;
const selected_block_col = 0x4d4dff;
const king_check_col = 0x004d99

//animation variables
const a_screen_initial = 0;
const a_screen_final = 0.9;
const a_screen_col = 0x222222;

const a_go_initial = 0;
const a_go_final = 1;
const a_go_col = 0x40a0ff;
const a_go_restart_col = 0x40a0ff;

const go_x = width*0.4;
const go_y = width*0.2;

const a_time = 1;	//in seconds
var a_percent = 0;

const delta_time = 1/40;


function Calculate_Mouse_Pos (evt) {
	var rect = canvas.getBoundingClientRect ();
	var root = document.documentElement;

	mouse_x = Math.floor ((evt.clientX - rect.left - root.scrollLeft)/size);
    mouse_y = Math.floor ((evt.clientY - rect.top - root.scrollTop)/size);

	// if (mouse_x == 8)
	// 	mouse_x--;
	// if (mouse_y == 8)
	// 	mouse_y--;

}

function Draw_Rect (x, y, l, b, col) {
	ctx.beginPath ();
	ctx.fillStyle = col;
	ctx.fillRect(x,y,l,b);
	ctx.closePath ();
}

function hexa (hex, a) {
	//0xRRGGBB
	return ("rgba(" + (hex>>16).toString() + "," + (hex>>8 & 0xFF).toString() + "," + (hex & 0xFF).toString() + "," + a.toString() + ")");
}

function Index_Abs (x, y) {
	return (x + 8*y);
}

function Draw_Board () {
	var col_t;
	for (var i = 0; i < 8; i++) {
		for (var j = 0; j < 8; j++) {
			if ((i+j)%2 == 1) {
				col_t = hexa (black_col, 1);
			} else {
				col_t = hexa(white_col, 1);
			}
			Draw_Rect (i*size, j*size, size, size, col_t);
		}

	}
}

function Draw_Possible_Moves (block) {
	Draw_Rect (block.x*size, block.y*size, size, size, hexa (outline_col, 1));

	Draw_Rect (block.x*size + delta_size, block.y*size + delta_size, draw_size, draw_size, hexa (selected_block_col, 1));

	for (var i = 0; i < block.moves.length; i++) {
		Draw_Rect (block.moves[i].x*size, block.moves[i].y*size, size, size, hexa (outline_col, 1));

		Draw_Rect (block.moves[i].x*size + delta_size, block.moves[i].y*size + delta_size, draw_size, draw_size, hexa (possible_moves_col, 1));
	}
}

function Change_Cur_Block () {
	if (board[Index_Abs (mouse_x, mouse_y)] != null && board[Index_Abs (mouse_x, mouse_y)].col == cur_turn) {
		cur_block = board[Index_Abs (mouse_x, mouse_y)];
	} else {
		cur_block = null;
	}
}

function Get_Opposite_Col (col) {
	if (col == "white") {
		return "black";
	} else {
		return "white";
	}
}

function Is_King_In_Check (king_col) {
	if (king_col == "black") {
		if (white_master.next != null)
			return white_master.next.Can_Check_King (black_king);
		else
			return false;

	} else {
		if (black_master.next != null)
			return black_master.next.Can_Check_King (white_king);
		else
			return false;
	}
}

function Lerp (a, b, val) {
	return a + (b-a)*val;
}

function reset_pawn_promotion () {
	pawn_promote_bool = false;
	pawn_promote = null;
}

function Animate_Screen () {
	// cur_block = null;
	Manual_Update ();
	a_percent += delta_time/a_time;
	if (a_percent > 1) {
		a_percent = 1;
	}

	var a_screen_alpha = Lerp (a_screen_initial, a_screen_final, a_percent);
	var a_go_alpha = Lerp (a_go_initial, a_go_final, a_percent);

	Draw_Rect (0, 0, width, width, hexa (a_screen_col, a_screen_alpha));

	ctx.font = "30px Arial";
    ctx.fillStyle = hexa (a_go_col, a_go_alpha);
	if (king_in_check) {
		//checkmate
    	ctx.fillText("Checkmate", go_x, go_y);
	} else {
		//stalemate
		ctx.fillText("Stalemate", go_x, go_y);
	}
	ctx.font = "30px Arial";
	ctx.fillStyle = hexa (a_go_restart_col, a_go_alpha);
	ctx.fillText("Press space to play again", 0.3*width, go_y + 100);

	if (a_percent == 1) {
		clearInterval (a_interval);
		a_interval = 0;
	}
}

function Set_Promotion_Type () {
	
	if (mouse_x == 3) {
		if (mouse_y == 3) {
			//rook
			return "rook";

		} else if (mouse_y == 4) {
			//horse
			return "horse";
		}
	} else if (mouse_x == 4) {
		if (mouse_y == 3) {
			//bishop
			return "bishop"

		} else if (mouse_y == 4) {
			//queen
			return "queen";
		}
	}

	return null;
}
