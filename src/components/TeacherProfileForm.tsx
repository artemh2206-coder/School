"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import type { FormEvent } from "react";

type TeacherProfileFormProps = {
  action: (formData: FormData) => Promise<void> | void;
  initial: {
    bio: string;
    experienceYears: number;
    gender: string;
    headline: string;
    introVideoUrl: string;
    isMarketplaceVisible: boolean;
    lessonPriceUah: number;
    profilePhotoPositionX: number;
    profilePhotoPositionY: number;
    profilePhotoUrl: string;
    specialties: string;
    teachingLanguages: string[];
    teachingStyle: string;
  };
};

const languageOptions = [
  { label: "Английский", value: "English" },
  { label: "Польский", value: "Polish" },
  { label: "Испанский", value: "Spanish" },
  { label: "Немецкий", value: "German" },
];

export function TeacherProfileForm({ action, initial }: TeacherProfileFormProps) {
  const [photoData, setPhotoData] = useState(initial.profilePhotoUrl);
  const [photoError, setPhotoError] = useState("");
  const [positionX, setPositionX] = useState(initial.profilePhotoPositionX);
  const [positionY, setPositionY] = useState(initial.profilePhotoPositionY);
  const [languages, setLanguages] = useState(() => new Set(initial.teachingLanguages));
  const objectPosition = `${positionX}% ${positionY}%`;
  const selectedLanguages = useMemo(() => [...languages].join(","), [languages]);

  function toggleLanguage(value: string) {
    setLanguages((current) => {
      const next = new Set(current);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }

  function pickPhoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Выберите файл изображения.");
      return;
    }
    if (file.size > 2_500_000) {
      setPhotoError("Фото слишком большое. Сейчас лимит 2.5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return;
      setPhotoData(reader.result);
      setPhotoError("");
    };
    reader.readAsDataURL(file);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    if (!languages.size) {
      event.preventDefault();
      setPhotoError("Выберите хотя бы один язык преподавания.");
    }
  }

  return (
    <form action={action} className="teacher-profile-form" onSubmit={submit}>
      <label>
        <span>Заголовок профиля</span>
        <input
          name="headline"
          placeholder="Разговорный английский без страха и скучной зубрежки"
          defaultValue={initial.headline}
        />
      </label>
      <label>
        <span>Видео-презентация до 30 секунд, URL</span>
        <input name="introVideoUrl" placeholder="https://..." defaultValue={initial.introVideoUrl} />
      </label>

      <div className="teacher-photo-editor wide-field">
        <div className="teacher-photo-copy">
          <span>Фото профиля</span>
          <strong>Загрузите картинку с устройства</strong>
          <p>Полная картинка пойдет в профиль, а мини-аватарку можно удобно сдвинуть ползунками.</p>
          <label className="teacher-photo-upload">
            Прикрепить картинку
            <input accept="image/*" onChange={(event) => pickPhoto(event.target.files?.[0])} type="file" />
          </label>
          {photoError ? <small>{photoError}</small> : null}
        </div>
        <div className="teacher-photo-preview">
          <div className="teacher-photo-full">
            {photoData ? <img alt="" src={photoData} /> : <span>Полное фото</span>}
          </div>
          <div className="teacher-photo-avatar">
            {photoData ? <img alt="" src={photoData} style={{ objectPosition }} /> : <span>А</span>}
          </div>
        </div>
        <div className="teacher-photo-controls">
          <label>
            <span>Сдвиг по горизонтали</span>
            <input max={100} min={0} onChange={(event) => setPositionX(Number(event.target.value))} type="range" value={positionX} />
          </label>
          <label>
            <span>Сдвиг по вертикали</span>
            <input max={100} min={0} onChange={(event) => setPositionY(Number(event.target.value))} type="range" value={positionY} />
          </label>
        </div>
      </div>

      <input name="profilePhotoUrl" type="hidden" value={photoData} />
      <input name="profilePhotoPositionX" type="hidden" value={positionX} />
      <input name="profilePhotoPositionY" type="hidden" value={positionY} />
      <input name="teachingLanguages" type="hidden" value={selectedLanguages} />

      <label>
        <span>Цена урока, грн</span>
        <input min={0} name="lessonPriceUah" type="number" defaultValue={initial.lessonPriceUah} />
      </label>
      <label>
        <span>Опыт, лет</span>
        <input min={0} name="experienceYears" type="number" defaultValue={initial.experienceYears} />
      </label>
      <label>
        <span>Пол</span>
        <select name="gender" defaultValue={initial.gender}>
          <option value="UNSPECIFIED">Не указывать</option>
          <option value="MALE">Мужчина</option>
          <option value="FEMALE">Женщина</option>
        </select>
      </label>
      <fieldset className="teacher-language-picker">
        <legend>Языки, которые вы преподаете</legend>
        {languageOptions.map((language) => (
          <label key={language.value}>
            <input
              checked={languages.has(language.value)}
              onChange={() => toggleLanguage(language.value)}
              type="checkbox"
            />
            <span>{language.label}</span>
          </label>
        ))}
      </fieldset>
      <label>
        <span>Специализации, через запятую</span>
        <input name="specialties" placeholder="A1-B2, разговорная практика, школьная программа" defaultValue={initial.specialties} />
      </label>
      <label>
        <span>Стиль уроков, через запятую</span>
        <input name="teachingStyle" placeholder="мягко, структурно, много практики" defaultValue={initial.teachingStyle} />
      </label>
      <label className="wide-field">
        <span>О себе</span>
        <textarea
          name="bio"
          placeholder="Расскажите, кому вы особенно полезны, как проходит первый урок и почему с вами комфортно учиться."
          defaultValue={initial.bio}
        />
      </label>
      <label className="teacher-profile-checkbox">
        <input name="isMarketplaceVisible" type="checkbox" defaultChecked={initial.isMarketplaceVisible} />
        <span>Показывать меня в каталоге учителей</span>
      </label>
      <button className="button primary" type="submit">
        Сохранить профиль
      </button>
    </form>
  );
}
