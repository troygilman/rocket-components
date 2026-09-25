package main

import (
	"flag"
	"log"
	"net/http"
)

func main() {
	addr := flag.String("addr", ":8080", "listen address")
	root := flag.String("root", "static", "directory to serve")
	flag.Parse()

	mux := http.NewServeMux()
	mux.Handle("GET /", http.FileServer(http.Dir(*root)))

	log.Printf("listening on http://localhost%s", *addr)
	log.Fatal(http.ListenAndServe(*addr, mux))
}
