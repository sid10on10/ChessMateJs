//for enpasse
var king_in_check = false;
var king_stalemate = false;

var pawn_promote_bool = false;
var pawn_promote = null;

function Piece (type, col, x, y) {
	// master
	// pawn
	// rook
	// horse
	// bishop
	// queen
	// king

	this.col = col;
	this.type = type;
	this.next = null;
	this.prev = null;

	if (type != "master") {
		//stores the x,y index on the board
		this.x = x;
		this.y = y;
		this.img = new Image;
		this.img.src = "Pieces/" + type + "_" + col + ".png";

		this.has_moved = false;
		this.moves = [];

		board[Index_Abs(x, y)] = this;

		this.img.onload = function () {
			Manual_Update ();
		}
	}
}

Piece.prototype.Add_Block = function (type, col, x, y) {
	if (this.next == null) {
		this.next = new Piece (type, col, x, y);
		this.next.prev = this;
	} else {
		this.next.Add_Block (type, col, x, y);
	}
}

Piece.prototype.Is_Stalemate = function () {
	if (this.moves.length != 0) {
		return false;
	}
	if (this.next != null) {
		return this.next.Is_Stalemate ();
	} else {
		return true;
	}
}

Piece.prototype.Get_Rook = function () {
	if (this.type == "rook") {
		return this;
	}
	if (this.next != null) {
		return this.next.Get_Rook ();
	} else {
		return null;
	}
}

Piece.prototype.Search_Moves = function (x, y) {
	//linear search
	var len = this.moves.length;
	for (var i = 0; i < len; i++) {
		if (x == this.moves[i].x && y == this.moves[i].y) {
			return true;
		}
	}
	return false;
}

Piece.prototype.Move_Block = function (x, y) {

	//move block
	board[Index_Abs (this.x, this.y)] = null;
	//capture enemy block if necessary
	if (board[Index_Abs (x, y)] != null) {
		//the block has to be opposite col as moves[] cannot have the block of same col
		board[Index_Abs (x, y)].Delete ();
	}
	board[Index_Abs (x, y)] = this;

	//check if casteling
	if (this.type == "king") {
		var dx = this.x - x;
		if (dx > 1) {
			//left castle
			var rook;
			//get rook
			if (this.col == "white") {
				rook = white_master.next.Get_Rook ();
				if (rook.x != 0)
					rook = rook.next.Get_Rook ();
			} else {
				rook = black_master.next.Get_Rook ();
				if (rook.x != 0)
					rook = rook.next.Get_Rook ();
			}

			//move rook
			rook.Move_Block (x+1, y);
		} else if (dx < -1) {
			//right castle
			var rook;
			//get rook
			if (this.col == "white") {
				rook = white_master.next.Get_Rook ();
				if (rook.x == 0)
					rook = rook.next.Get_Rook ();
			} else {
				rook = black_master.next.Get_Rook ();
				if (rook.x == 0)
					rook = rook.next.Get_Rook ();
			}
			//move rook
			rook.Move_Block (x-1, y);
		}
	}

	this.x = x;
	this.y = y;
	this.has_moved = true;

	//pawn promotion
	if (this.type == "pawn") {
		if (this.y == 0 || this.y == 7) {
			//promote pawn
			pawn_promote_bool = true;
			pawn_promote = this;
		}
	}
	this.Calculate_Moves ();
}

Piece.prototype.Delete_All = function () {
	if (this.next != null) {
		this.next.Delete_All ();
	}
	this.next = null;
	this.prev = null;
	delete this.img;
}

Piece.prototype.Delete = function () {
	// board[this.x*8 + this.y] = null;
	if (this.prev != null)
		this.prev.next = this.next;
	if (this.next != null)
		this.next.prev = this.prev;
	board[Index_Abs (this.x, this.y)] = null;
	delete this.img;
}
Piece.prototype.Virtual_Disconnect = function () {
	if (this.prev != null)
		this.prev.next = this.next;
	if (this.next != null)
		this.next.prev = this.prev;
	board[Index_Abs (this.x, this.y)] = null;
}
Piece.prototype.Virtual_Reconnect = function () {
	if (this.prev != null)
		this.prev.next = this;
	if (this.next != null)
		this.next.prev = this;
}
Piece.prototype.Virtual_Move = function (x, y) {
	//name is misleading.... it changes this.x to x but stores original pposition in virtual pos array
	if (this.virtual_old_pos_len == undefined) {
		//first virtual move
		// console.log("Created");
		this.virtual_old_pos = [];
		this.virtual_old_pos_len = 0;

		this.virtual_new_piece = [];
		this.virtual_new_piece_len = 0;
	}

	//store temporary location before virtual mvoe
	this.virtual_old_pos[this.virtual_old_pos_len] = {x: this.x, y: this.y};
	this.virtual_old_pos_len += 1;

	this.virtual_new_piece[this.virtual_new_piece_len] = board[Index_Abs (x, y)];

	if (board[Index_Abs (x, y)] != null) {
		//virtually disconnect it
		board[Index_Abs (x, y)].Virtual_Disconnect ();
	}
	this.virtual_new_piece_len += 1;

	//virtual move
	board[Index_Abs (this.x, this.y)] = null;
	this.x = x;
	this.y = y;
	board[Index_Abs (x, y)] = this;

}

Piece.prototype.Virtual_Undo_Move = function () {
	if (this.virtual_old_pos_len == undefined) {
		//piece never virtually moved
		return;
	} else {

		//-= must come before cause when len is 1 we need index 0
		this.virtual_new_piece_len -= 1;
		board[Index_Abs (this.x, this.y)] = this.virtual_new_piece[this.virtual_new_piece_len];

		if (board[Index_Abs (this.x, this.y)] != null) {
			board[Index_Abs (this.x, this.y)].Virtual_Reconnect ();
		}


		//-= must come before cause when len is 1 we need index 0
		this.virtual_old_pos_len -= 1;
		this.x = this.virtual_old_pos[this.virtual_old_pos_len].x;
		this.y = this.virtual_old_pos[this.virtual_old_pos_len].y;

		board[Index_Abs (this.x, this.y)] = this;

		if (this.virtual_old_pos_len == 0) {
			//all virtual moves are over.... delete virtual variables
			delete this.virtual_old_pos_len;
			delete this.virtual_old_pos;
			delete this.virtual_new_piece_len;
			delete this.virtual_new_piece;
		}
	}

}
Piece.prototype.Draw = function () {
	//draw all
	ctx.drawImage (this.img, this.x*size, this.y*size, size, size);

	if (this.next != null) {
		this.next.Draw ();
	}
}

//returns 1D array index of a block (x,y) positions relative to this
Piece.prototype.Index = function (x, y) {
	return (this.x+x) + (this.y+y)*8;
}
//pushes (x,y) position relative to this object to this.possible moves
Piece.prototype.Push_rel = function (x, y) {
	this.moves.push ({x:(this.x+x), y:(this.y + y)});
}
Piece.prototype.Push_Abs = function (x, y) {
	this.moves.push ({x:x, y:y});
}
//returns if the relative position (x,y) is on the board or not
Piece.prototype.Is_Valid_Index = function (x,y) {
	return (this.x+x < 8) && (this.x+x > -1) && (this.y+y<8) &&(this.y+y>-1);
}


Piece.prototype.Can_Check_King = function (block) {
	if (this.Search_Moves (block.x, block.y)) {
		return true;
	}

	if (this.next != null) {
		return this.next.Can_Check_King (block);
	} else {
		return false;
	}
}



//calculate moves for individual pieces

Piece.prototype.Calculate_Moves_pawn = function () {
	//add front moves if there is no obstruction
	var mult = 1;
	if (this.col == "white") {
		mult = -1;
	}

	if (board[this.Index(0, mult)] == null) {
		this.Push_rel (0, mult);

		//checkl for obstruction to add the initial two space move
		if (!this.has_moved && board[this.Index (0, mult*2)] == null)
			this.Push_rel (0, mult*2);
	}

	//add diagnol moves
	if (this.x < 7 && board[this.Index (1, mult)] != null) {
		if (board[this.Index (1, mult)].col != this.col)
			this.Push_rel (1, mult);
	}

	if (this.x > 0 && board[this.Index (-1, mult)] != null) {
		if (board[this.Index (-1, mult)].col != this.col)
			this.Push_rel (-1, mult);
	}

	//add enpasse----- UGHHH WHYYY.... So much work :(

}

Piece.prototype.Calculate_Moves_rook = function () {
	//ROW, RIGHT of position
	for (var i = this.x+1; i < 8; i++) {

		if (board[Index_Abs (i, this.y)] == null) {
			this.Push_Abs (i, this.y);
		} else if (board[Index_Abs (i, this.y)].col != this.col) {
			this.Push_Abs (i, this.y);
			break;
		} else {
			break;
		}
	}
	//ROW, LEFT of position
	for (var i = this.x-1; i > -1; i--) {
		if (board[Index_Abs (i, this.y)] == null) {
			this.Push_Abs (i, this.y);
		} else if (board[Index_Abs (i, this.y)].col != this.col){
			this.Push_Abs (i, this.y);
			break;
		} else {
			break;
		}
	}

	//Col, down of position
	for (var i = this.y+1; i < 8; i++) {
		if (board[Index_Abs (this.x, i)] == null) {
			this.Push_Abs (this.x, i);
		} else if (board[Index_Abs (this.x, i)].col != this.col) {
			this.Push_Abs (this.x, i);
			break;
		} else {
			break;
		}
	}
	//Col, up of position
	for (var i = this.y-1; i > -1; i--) {
		if (board[Index_Abs (this.x, i)] == null) {
			this.Push_Abs (this.x, i);
		} else if (board[Index_Abs (this.x, i)].col != this.col) {
			this.Push_Abs (this.x, i);
			break;
		} else {
			break;
		}
	}

}

Piece.prototype.Calculate_Moves_horse = function () {
	//check top
	if (this.Is_Valid_Index (1, -2)) {
		if (board[this.Index (1, -2)] == null || board[this.Index (1, -2)].col != this.col)
			this.Push_rel (1, -2);
	}
	if (this.Is_Valid_Index (-1, -2)) {
		if (board[this.Index (-1, -2)] == null || board[this.Index (-1, -2)].col != this.col)
			this.Push_rel (-1, -2);
	}
	//check down
	if (this.Is_Valid_Index (1, 2)) {
		if (board[this.Index (1, 2)] == null || board[this.Index (1, 2)].col != this.col)
			this.Push_rel (1, 2);
	}
	if (this.Is_Valid_Index (-1, 2)) {
		if (board[this.Index (-1, 2)] == null || board[this.Index (-1, 2)].col != this.col)
			this.Push_rel (-1, 2);
	}
	//chec left
	if (this.Is_Valid_Index (-2, 1)) {
		if (board[this.Index (-2, 1)] == null || board[this.Index (-2, 1)].col != this.col)
			this.Push_rel (-2, 1);
	}
	if (this.Is_Valid_Index (-2, -1)) {
		if (board[this.Index (-2, -1)] == null || board[this.Index (-2, -1)].col != this.col)
			this.Push_rel (-2, -1);
	}
	//check right
	if (this.Is_Valid_Index (2, 1)) {
		if (board[this.Index (2, 1)] == null || board[this.Index (2, 1)].col != this.col)
			this.Push_rel (2, 1);
	}
	if (this.Is_Valid_Index (2, -1)) {
		if (board[this.Index (2, -1)] == null || board[this.Index (2, -1)].col != this.col)
			this.Push_rel (2, -1);
	}
}

Piece.prototype.Calculate_Moves_bishop = function () {

	//North West diagonal
	var min = Math.min (this.x, this.y);
	for (var i = 1; i <= min; i++) {

		if (board[this.Index (-i, -i)] == null) {
			this.Push_rel (-i, -i);
		} else if (board[this.Index (-i, -i)].col != this.col) {
			this.Push_rel (-i, -i);
			break;
		} else {
			break;
		}
	}

	//North East diagonal
	min = Math.min (7-this.x, this.y)
	for (var i = 1; i <= min; i++) {
		if (board[this.Index (i, -i)] == null) {
			this.Push_rel (i, -i);
		} else if (board[this.Index (i, -i)].col != this.col) {
			this.Push_rel (i, -i);
			break;
		} else {
			break;
		}
	}

	//South West
	min = Math.min (this.x, 7- this.y);
	for (var i = 1; i <= min; i++) {
		if (board[this.Index (-i, i)] == null) {
			this.Push_rel (-i, i);
		} else if (board[this.Index (-i, i)].col != this.col) {
			this.Push_rel (-i, i);
			break;
		} else {
			break;
		}
	}
	//Col, up of position
	min = Math.min (7 - this.x, 7 - this.y);
	for (var i = 1; i <= min; i++) {
		if (board[this.Index (i, i)] == null) {
			this.Push_rel (i, i);
		} else if (board[this.Index (i, i)].col != this.col) {
			this.Push_rel (i, i);
			break;
		} else {
			break;
		}
	}
}

Piece.prototype.Calculate_Moves_queen = function () {
	this.Calculate_Moves_rook ();
	this.Calculate_Moves_bishop ();
}

Piece.prototype.Calculate_Moves_king = function () {

	for (var dy = -1; dy <= 1; dy++) {
		for (var dx = -1; dx <= 1; dx++) {
			if (!dx && !dy)
				continue;

			if (this.Is_Valid_Index(dx,dy)) {
				if (board[this.Index (dx, dy)] == null || board[this.Index (dx, dy)].col != this.col)
					this.Push_rel (dx, dy);
			}

		}
	}

	if (this.has_moved) {
		//do not check for casteling
		return;
	}

	//get rook variables
	var rook1 = null;
	var rook2 = null;
	if (this.col == "white") {
		if (white_master.next != null) {
			rook1 = white_master.next.Get_Rook ();
		}
	} else {
		if (black_master.next != null) {
			rook1 = black_master.next.Get_Rook ();
		}
	}

	if (rook1 != null && rook1.next != null) {
		rook2 = rook1.next.Get_Rook ();
	}

	//implement casteling
	if (rook1 != null) {
			if (!rook1.has_moved) {
				if (rook1.x == 0) {
					//left rook
					if (board[this.Index (-1,0)] == null && board[this.Index (-2,0)] == null && board[this.Index  (-3,0)] == null) {
						console.log("castle");
						this.Push_rel (-2, 0);
					}

				} else {
					//right rook
					if (board[this.Index (1,0)] == null && board[this.Index (2,0)] == null) {
						console.log("castle");
						this.Push_rel (2, 0);
					}
				}
			}
	}

	//do it for the other rook
	if (rook2 != null) {
			if (!rook2.has_moved) {
				if (rook2.x == 0) {
					//left rook
					if (board[this.Index (-1,0)] == null && board[this.Index (-2,0)] == null && board[this.Index  (-3,0)] == null) {
						console.log("castle");
						this.Push_rel (-2, 0);
					}

				} else {
					//right rook
					if (board[this.Index (1,0)] == null && board[this.Index (2,0)] == null) {
						console.log("castle");
						this.Push_rel (2, 0);
					}
				}
			}
	}

	rook1 = null;
	rook2 = null;

}
Piece.prototype.Calculate_Moves = function () {
	//clears array
	this.Calculate_Moves_Without_Discover_Check ();
	var new_moves = [];
	var new_move_length_jimbo = 0;

	for (var i = 0; i < this.moves.length; i++) {

		if (!this.Check_Discover_Check (this.moves[i])) {
			new_moves[new_move_length_jimbo] = (this.moves[i]);
			new_move_length_jimbo += 1;

		}
	}

	//copy to moves array
	this.moves.length = 0;
	for (var j = 0; j < new_move_length_jimbo; j++) {
		this.moves.push (new_moves[j]);
	}

	new_moves.length = 0;
	new_move_length_jimbo = 0;
}

Piece.prototype.Calculate_Moves_Without_Discover_Check = function () {
	this.moves.length = 0;
	eval ("this.Calculate_Moves_" + this.type + "()");
}

Piece.prototype.Calculate_Moves_All_Without_Discover_Check = function () {
	this.Calculate_Moves_Without_Discover_Check ();

	if (this.next != null) {
		this.next.Calculate_Moves_All_Without_Discover_Check ();
	}
}

Piece.prototype.Calculate_Moves_All = function () {
	this.Calculate_Moves ();

	if (this.next != null) {
		this.next.Calculate_Moves_All ();
	}
}

Piece.prototype.Check_Discover_Check = function (coord) {

	this.Virtual_Move (coord.x, coord.y);
	if (this.col == "white") {
	//while checking discover check for white, we only need to check possible moves of black
		if (black_master.next != null)
			black_master.next.Calculate_Moves_All_Without_Discover_Check ();
	} else {
		if (white_master.next != null)
			white_master.next.Calculate_Moves_All_Without_Discover_Check ();
	}

	var discovered_chk = Is_King_In_Check (this.col);
	this.Virtual_Undo_Move ();

	if (this.col == "white") {
		if (black_master.next != null)
			black_master.next.Calculate_Moves_All_Without_Discover_Check ();
	} else {
		if (white_master.next != null)
			white_master.next.Calculate_Moves_All_Without_Discover_Check ();
	}
	return discovered_chk;
}
