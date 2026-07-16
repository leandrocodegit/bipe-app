package org.owntracks.android.support.webrtc;


public class Message {

    private String sessaoid;
    private Tipo tipo;
    private String data;

    public Message() {
    }

    public Message(Tipo tipo) {
        this.tipo = tipo;
    }

    public Message(String sessaoid, Tipo tipo) {
        this.sessaoid = sessaoid;
        this.tipo = tipo;
    }

    public Message(String sessaoid, Tipo tipo, String data) {
        this.sessaoid = sessaoid;
        this.tipo = tipo;
        this.data = data;
    }

    public String getSessaoid() {
        return sessaoid;
    }

    public void setSessaoid(String sessaoid) {
        this.sessaoid = sessaoid;
    }

    public Tipo getTipo() {
        return tipo;
    }

    public void setTipo(Tipo tipo) {
        this.tipo = tipo;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }
}
