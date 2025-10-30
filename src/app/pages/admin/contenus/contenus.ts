import { Component, OnInit } from '@angular/core';
import {CommonModule} from '@angular/common';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {FormsModule} from '@angular/forms';

interface Subject {
  id: number;
  name: string;
  description: string;
  quizCount: number;
  studentsCount: number;
}

interface Level {
  id: number;
  name: string;
  cycle: string;
  classesCount: number;
  studentsCount: number;
}

interface Class {
  id: number;
  name: string;
  level: string;
  teacher: string;
  studentsCount: number;
}

@Component({
  selector: 'app-contenus',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contenus.html',
  styleUrls: [ './contenus.css'],
})
export class Contenus implements OnInit {
  currentTab: 'subjects' | 'levels' | 'classes' = 'subjects';
  isModalOpen = false;
  editingId: number | null = null;
  modalTitle = '';

  // Données d'exemple
  subjects: Subject[] = [
    { id: 1, name: "Mathématiques", description: "Algèbre, géométrie et analyse", quizCount: 15, studentsCount: 240 },
    { id: 2, name: "Français", description: "Grammaire, orthographe et littérature", quizCount: 12, studentsCount: 235 },
    { id: 3, name: "Histoire-Géographie", description: "Histoire mondiale et géographie", quizCount: 8, studentsCount: 220 },
    { id: 4, name: "Sciences Physiques", description: "Physique et chimie", quizCount: 10, studentsCount: 180 },
    { id: 5, name: "SVT", description: "Sciences de la Vie et de la Terre", quizCount: 7, studentsCount: 175 },
    { id: 6, name: "Anglais", description: "Langue anglaise", quizCount: 9, studentsCount: 210 }
  ];

  levels: Level[] = [
    { id: 1, name: "6ème", cycle: "college", classesCount: 5, studentsCount: 150 },
    { id: 2, name: "5ème", cycle: "college", classesCount: 5, studentsCount: 145 },
    { id: 3, name: "4ème", cycle: "college", classesCount: 5, studentsCount: 140 },
    { id: 4, name: "3ème", cycle: "college", classesCount: 5, studentsCount: 135 },
    { id: 5, name: "Seconde", cycle: "lycee", classesCount: 4, studentsCount: 120 },
    { id: 6, name: "Première", cycle: "lycee", classesCount: 4, studentsCount: 115 }
  ];

  classes: Class[] = [
    { id: 1, name: "6ème A", level: "6ème", teacher: "M. Dupont", studentsCount: 30 },
    { id: 2, name: "6ème B", level: "6ème", teacher: "Mme. Martin", studentsCount: 28 },
    { id: 3, name: "5ème A", level: "5ème", teacher: "M. Leroy", studentsCount: 29 },
    { id: 4, name: "5ème B", level: "5ème", teacher: "Mme. Bernard", studentsCount: 30 },
    { id: 5, name: "4ème A", level: "4ème", teacher: "M. Petit", studentsCount: 28 },
    { id: 6, name: "4ème B", level: "4ème", teacher: "Mme. Durand", studentsCount: 27 }
  ];

  // Données du formulaire
  formData = {
    name: '',
    description: '',
    cycle: 'college',
    level: '6ème',
    teacher: ''
  };

  ngOnInit() {}

  switchTab(tab: 'subjects' | 'levels' | 'classes') {
    this.currentTab = tab;
  }

  openAddModal() {
    this.isModalOpen = true;
    this.editingId = null;
    this.resetForm();

    switch(this.currentTab) {
      case 'subjects':
        this.modalTitle = 'Ajouter une matière';
        break;
      case 'levels':
        this.modalTitle = 'Ajouter un niveau';
        break;
      case 'classes':
        this.modalTitle = 'Ajouter une classe';
        break;
    }
  }

  openEditModal(id: number) {
    this.isModalOpen = true;
    this.editingId = id;

    switch(this.currentTab) {
      case 'subjects':
        const subject = this.subjects.find(s => s.id === id);
        if (subject) {
          this.modalTitle = 'Modifier la matière';
          this.formData.name = subject.name;
          this.formData.description = subject.description;
        }
        break;
      case 'levels':
        const level = this.levels.find(l => l.id === id);
        if (level) {
          this.modalTitle = 'Modifier le niveau';
          this.formData.name = level.name;
          this.formData.cycle = level.cycle;
        }
        break;
      case 'classes':
        const classItem = this.classes.find(c => c.id === id);
        if (classItem) {
          this.modalTitle = 'Modifier la classe';
          this.formData.name = classItem.name;
          this.formData.level = classItem.level;
          this.formData.teacher = classItem.teacher;
        }
        break;
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.resetForm();
  }

  resetForm() {
    this.formData = {
      name: '',
      description: '',
      cycle: 'college',
      level: '6ème',
      teacher: ''
    };
  }

  saveContent() {
    if (!this.formData.name.trim()) {
      alert('Veuillez remplir le nom');
      return;
    }

    switch(this.currentTab) {
      case 'subjects':
        if (this.editingId) {
          // Modification
          const subject = this.subjects.find(s => s.id === this.editingId);
          if (subject) {
            subject.name = this.formData.name;
            subject.description = this.formData.description;
          }
        } else {
          // Ajout
          const newId = this.subjects.length > 0 ? Math.max(...this.subjects.map(s => s.id)) + 1 : 1;
          this.subjects.push({
            id: newId,
            name: this.formData.name,
            description: this.formData.description,
            quizCount: 0,
            studentsCount: 0
          });
        }
        break;

      case 'levels':
        if (this.editingId) {
          // Modification
          const level = this.levels.find(l => l.id === this.editingId);
          if (level) {
            level.name = this.formData.name;
            level.cycle = this.formData.cycle;
          }
        } else {
          // Ajout
          const newId = this.levels.length > 0 ? Math.max(...this.levels.map(l => l.id)) + 1 : 1;
          this.levels.push({
            id: newId,
            name: this.formData.name,
            cycle: this.formData.cycle,
            classesCount: 0,
            studentsCount: 0
          });
        }
        break;

      case 'classes':
        if (this.editingId) {
          // Modification
          const classItem = this.classes.find(c => c.id === this.editingId);
          if (classItem) {
            classItem.name = this.formData.name;
            classItem.level = this.formData.level;
            classItem.teacher = this.formData.teacher;
          }
        } else {
          // Ajout
          const newId = this.classes.length > 0 ? Math.max(...this.classes.map(c => c.id)) + 1 : 1;
          this.classes.push({
            id: newId,
            name: this.formData.name,
            level: this.formData.level,
            teacher: this.formData.teacher,
            studentsCount: 0
          });
        }
        break;
    }

    this.closeModal();
  }

  deleteItem(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      switch(this.currentTab) {
        case 'subjects':
          this.subjects = this.subjects.filter(s => s.id !== id);
          break;
        case 'levels':
          this.levels = this.levels.filter(l => l.id !== id);
          break;
        case 'classes':
          this.classes = this.classes.filter(c => c.id !== id);
          break;
      }
    }
  }

  get showSubjectFields(): boolean {
    return this.currentTab === 'subjects';
  }

  get showLevelFields(): boolean {
    return this.currentTab === 'levels';
  }

  get showClassFields(): boolean {
    return this.currentTab === 'classes';
  }
}
