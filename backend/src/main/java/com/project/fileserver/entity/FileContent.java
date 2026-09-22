package com.project.fileserver.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "file_contents")
public class FileContent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "file_id", nullable = false, unique = true)
    private FileMetadata file;

    @Lob
    @Column(name = "data", nullable = false)
    private byte[] data;

    public FileContent() {}

    public FileContent(FileMetadata file, byte[] data) {
        this.file = file;
        this.data = data;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public FileMetadata getFile() {
        return file;
    }

    public void setFile(FileMetadata file) {
        this.file = file;
    }

    public byte[] getData() {
        return data;
    }

    public void setData(byte[] data) {
        this.data = data;
    }
}
