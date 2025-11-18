package main

import (
	"fmt"
	"go-react-webrtc/server"
	"log"
	"net/http"
)

func main() {
	server.AllRooms.Init()
	server.Broadcaster()

	http.HandleFunc("/create", server.CreateRoomRequestHandler)
	http.HandleFunc("/join", server.JoinRoomRequestHandler)

	log.Println("starting Server on  Port 8000")
	fmt.Println(" ")
	err := http.ListenAndServe(":8000", nil)
	if err != nil {
		log.Fatal((err))
	}

}
