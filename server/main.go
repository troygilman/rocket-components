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

func (s *Store) Snapshot() []Container {
	s.mu.Lock()
	defer s.mu.Unlock()
	return slices.Clone(s.containers)
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

func (srv *Server) handleDraggablePage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	if err := srv.tmpl.ExecuteTemplate(w, "draggable.html", srv.store.Snapshot()); err != nil {
		log.Printf("render page: %v", err)
	}
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
	root := flag.String("root", "..", "directory containing draggable/ and vendor/")
	flag.Parse()
	static := http.FileServer(http.Dir(*root))

	srv := &Server{
		store: &Store{containers: []Container{
			{ID: "drag-container-1", Label: "Container 1"},
			{ID: "drag-container-2", Label: "Container 2"},
			{ID: "drag-container-3", Label: "Container 3"},
		}},
		tmpl: template.Must(template.ParseFiles(filepath.Join(*root, "draggable", "draggable.html"))),
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/draggable/", http.StatusFound)
	})
	mux.HandleFunc("GET /draggable/{$}", srv.handleDraggablePage)
	mux.HandleFunc("GET /draggable/draggable.html", srv.handleDraggablePage)
	mux.HandleFunc("POST /cmd/swap-containers", srv.handleSwapContainers)
	mux.Handle("GET /draggable/", static)
	mux.Handle("GET /vendor/", static)

	log.Printf("listening on http://localhost%s", *addr)
	log.Fatal(http.ListenAndServe(*addr, mux))
}
