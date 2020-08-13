//black_master
//white_master should be the name
var black_master;
var white_master;
var black_king;
var white_king;

//stores position of all pieces
//row 1 column 0 is stored at index 8
var board = [];


var cur_block = null;
var cur_turn = "white";

var a_interval = 0;
window.onload = function () {


	black_master = new Piece ("master", "black", -1, -1);
	white_master = new Piece ("master", "white", -1, -1);

	Initialise_Game  ();

	canvas.addEventListener ("mousemove", Calculate_Mouse_Pos);

	canvas.addEventListener ("mousedown", function (evt) {
		// - check if empty
		// - if not check if its in moves_available
		// - else change block

			if (!king_stalemate) {

				//check for pawn promotion
					if (pawn_promote_bool) {
						
						var promotion_type = Set_Promotion_Type ();

						if (promotion_type != null) {
							pawn_promote.type = promotion_type;
							pawn_promote.img.src = "Pieces/" + promotion_type + "_" + pawn_promote.col + ".png";
							
							pawn_promote.Calculate_Moves ();
							reset_pawn_promotion ();
							
							//do not change turn as it has already been changed

							if (Is_King_In_Check (cur_turn)) {
								king_in_check = true;
							}

							if (cur_turn == "white") {
								king_stalemate = white_master.next.Is_Stalemate ();
							} else {
								king_stalemate = black_master.next.Is_Stalemate ();
							}
						
						}

				} else {
					if (cur_block == null) {
					Change_Cur_Block ();
					

					} else if (cur_block.Search_Moves (mouse_x, mouse_y)) {
						cur_block.Move_Block (mouse_x, mouse_y);
						king_in_check = false;

						white_master.next.Calculate_Moves_All ();
						black_master.next.Calculate_Moves_All ();
						//check if any piece can give a check to the king or not

						cur_turn = Get_Opposite_Col (cur_turn);
						if (Is_King_In_Check (cur_turn)) {
							king_in_check = true;
						}

						if (cur_turn == "white") {
							king_stalemate = white_master.next.Is_Stalemate ();
						} else {
							king_stalemate = black_master.next.Is_Stalemate ();
						}

						cur_block = null;

					} else {
						Change_Cur_Block ();
						
					}

					if (cur_block != null) {
						cur_block.Calculate_Moves ();
					}
				}

				if (king_stalemate) {
					if (a_interval == 0) {
						a_interval = setInterval (Animate_Screen, delta_time*1000);
					}
				}

				Manual_Update ();

				console.log (king_in_check);
		}
		
	});

	document.addEventListener ("keydown", function(evt) {
			//for debugging
			if (evt.keyCode == 32) {
				if (king_stalemate) {
					Initialise_Game ();
				} else {
					black_master.next.next.Delete ();
					Manual_Update ();
				}
			}
	});
}

function Initialise_Game () {

	king_in_check = false;
	king_stalemate = false;

	reset_pawn_promotion ();

	black_king = null;
	white_king = null;

	cur_turn = "white";
	cur_block = null;
	//initialise board
	for (var i = 0; i < 64; i++) {
		board[i] = null;
	}
	board.length = 64;

	//delete all pieces
	if (white_master.next != null) {
		white_master.next.Delete_All ();
	}
	if (black_master.next != null) {
		black_master.next.Delete_All ();
	}
	white_master.next = null;
	black_master.next = null;

	a_screen_percent = 0;
	a_interval = 0;

	//add black pieces
	black_master.Add_Block ("king", "black", 4, 0);
	black_king = black_master.next;

	black_master.Add_Block ("rook", "black", 0, 0);

	black_master.Add_Block ("rook", "black", 7, 0);


	black_master.Add_Block ("queen", "black", 3, 0);
	black_master.Add_Block ("horse", "black", 1, 0);
	black_master.Add_Block ("horse", "black", 6, 0);
	black_master.Add_Block ("bishop", "black", 2, 0);
	black_master.Add_Block ("bishop", "black", 5, 0);
	for (var i = 0; i < 8; i++) {
		black_master.Add_Block ("pawn", "black", i, 1);
	}

	//add white pieces
	white_master.Add_Block ("king", "white", 4, 7);
	white_king = white_master.next;

	white_master.Add_Block ("rook", "white", 0, 7);

	white_master.Add_Block ("rook", "white", 7, 7);


	white_master.Add_Block ("queen", "white", 3, 7);
	white_master.Add_Block ("horse", "white", 1, 7);
	white_master.Add_Block ("horse", "white", 6, 7);
	white_master.Add_Block ("bishop", "white", 2, 7);
	white_master.Add_Block ("bishop", "white", 5, 7);
	for (var i = 0; i < 8; i++) {
		white_master.Add_Block ("pawn", "white", i, 6);
	}

	white_master.next.Calculate_Moves_All ();
	black_master.next.Calculate_Moves_All ();
}

function Manual_Update () {

	ctx.clearRect (0, 0, width, width);
	//draw board
	Draw_Board ();

	//draw block---- for debugging 
	// for (var i = 0; i < 8; i++) {
	// 	for (var j = 0; j < 8; j++) {
	// 		if (board[i*8 +j] != null) {
	// 			Draw_Rect (j*size, i*size, size, size, "rgba(0,0,255,0.5)");
	// 		}
	// 	}
	// }

	if (cur_block != null) {
		//draw possible moves
		Draw_Possible_Moves (cur_block);
	}


	if (king_in_check) {
		var x_pos;
		var y_pos;
		if (cur_turn == "white") {
			x_pos = white_king.x;
			y_pos = white_king.y;
		} else {
			x_pos = black_king.x;
			y_pos = black_king.y;
		}

		//show check... draw red box around king
		Draw_Rect (x_pos*size, y_pos*size, size, size, hexa (outline_col, 1));

		Draw_Rect (x_pos*size + delta_size, y_pos*size + delta_size, draw_size, draw_size, hexa (king_check_col, 1));
	}


	if (pawn_promote_bool) {
			var draw_img = new Image;
			draw_img.src = "Pieces/" + "rook" + "_" + pawn_promote.col + ".png";
			ctx.drawImage (draw_img, 3*size, 3*size, size, size);

			draw_img.src = "Pieces/" + "horse" + "_" + pawn_promote.col + ".png";
			ctx.drawImage (draw_img, 3*size, 4*size, size, size);

			draw_img.src = "Pieces/" + "bishop" + "_" + pawn_promote.col + ".png";
			ctx.drawImage (draw_img, 4*size, 3*size, size, size);

			draw_img.src = "Pieces/" + "queen" + "_" + pawn_promote.col + ".png";
			ctx.drawImage (draw_img, 4*size, 4*size, size, size);

	} else {
		if (black_master.next != null)
			black_master.next.Draw ();
		if (white_master.next != null)
			white_master.next.Draw ();
	}

}
