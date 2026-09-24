package main

import (
	"bytes"
	"flag"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"path/filepath"
	"slices"
	"sync"

	"github.com/starfederation/datastar-go/datastar"
)

type Container struct {
	ID    string
	Label string
}

type Store struct {
	mu         sync.Mutex
	containers []Container
}

func (s *Store) Swap(id, target string) ([]Container, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	i := slices.IndexFunc(s.containers, func(c Container) bool { return c.ID == id })
	j := slices.IndexFunc(s.containers, func(c Container) bool { return c.ID == target })
	if i < 0 || j < 0 {
		return nil, fmt.Errorf("unknown container: %q -> %q", id, target)
	}
	s.containers[i], s.containers[j] = s.containers[j], s.containers[i]
	return slices.Clone(s.containers), nil
}

type Server struct {
	store *Store
	tmpl  *template.Template
}

type SwapSignals struct {
	ID     string `json:"id"`
	Target string `json:"target"`
}

func (srv *Server) handleSwapContainers(w http.ResponseWriter, r *http.Request) {
	var signals SwapSignals
	if err := datastar.ReadSignals(r, &signals); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	containers, err := srv.store.Swap(signals.ID, signals.Target)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var buf bytes.Buffer
	if err := srv.tmpl.ExecuteTemplate(&buf, "containers", containers); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	sse := datastar.NewSSE(w, r)
	if err := sse.PatchElements(buf.String(), datastar.WithViewTransitions()); err != nil {
		log.Printf("patch containers: %v", err)
	}
}

func main() {
	addr := flag.String("addr", ":8080", "listen address")
	root := flag.String("root", "static", "directory to serve")
	flag.Parse()

	srv := &Server{
		store: &Store{containers: []Container{
			{ID: "drag-container-1", Label: "Container 1"},
			{ID: "drag-container-2", Label: "Container 2"},
			{ID: "drag-container-3", Label: "Container 3"},
		}},
		tmpl: template.Must(template.ParseFiles(filepath.Join(*root, "components", "draggable", "draggable.html"))),
	}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /cmd/swap-containers", srv.handleSwapContainers)
	mux.Handle("GET /", http.FileServer(http.Dir(*root)))

	log.Printf("listening on http://localhost%s", *addr)
	log.Fatal(http.ListenAndServe(*addr, mux))
}
