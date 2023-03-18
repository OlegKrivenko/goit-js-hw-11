import simpleLightbox from 'simplelightbox';
// Дополнительный импорт стилей
import 'simplelightbox/dist/simple-lightbox.min.css';
import { Notify } from 'notiflix/build/notiflix-notify-aio';
import axios from 'axios';

const API_KEY = '25741253-e7e81d4e6d6388e3c07e8899b';
const URL = 'https://pixabay.com/api/';
const STORAGE_KEY = 'search-form-state';

const searchForm = document.querySelector('#search-form');
const searchBtn = searchForm.querySelector('button');

const loadBtn = document.querySelector('[type="button"]');
const galleryItems = document.querySelector('.gallery');

let searchPage = 1; //номер первоначальной страницы где будут отображатся картинкиза один запрос на сервер
const perPage = 40; //количество картинок за один запрос на сервер

searchForm.addEventListener('input', () => {
  loadBtn.classList.add('hidden');
  searchBtn.disabled = false;
});

searchForm.addEventListener('submit', onSubmitForm);

function onSubmitForm(event) {
  event.preventDefault();
  cleanImages();

  const {
    elements: { searchQuery },
  } = event.currentTarget;

  if (!searchQuery.value) {
    return;
  }

  localStorage.setItem(STORAGE_KEY, searchQuery.value);

  getImg();

  searchBtn.disabled = true;
}

loadBtn.addEventListener('click', onClickLoadBtn);
function onClickLoadBtn() {
  getImg();
}

async function getImg() {
  try {
    const response = await axios.get(URL, {
      params: {
        key: API_KEY,
        q: localStorage.getItem(STORAGE_KEY),
        image_type: 'photo',
        orientation: 'horizontal',
        safesearch: 'true',
        page: searchPage,
        per_page: perPage,
      },
    });

    if (!response.data.hits.length) {
      Notify.failure(
        'Sorry, there are no images matching your search query. Please try again.'
      );
      return;
    }

    if (searchPage === 1) {
      Notify.success(`Hooray! We found ${response.data.totalHits} images.`);
    }
    renderImages(response.data.hits);

    if (Math.ceil(response.data.totalHits / perPage) === searchPage) {
      Notify.failure(
        "We're sorry, but you've reached the end of search results."
      );

      loadBtn.classList.add('hidden');
      return;
    }

    loadBtn.classList.remove('hidden');
    searchPage += 1;
  } catch (error) {
    console.error(error);
  }
}

function renderImages(imagesArray) {
  const markup = imagesArray
    .map(
      ({
        webformatURL,
        largeImageURL,
        tags,
        likes,
        views,
        comments,
        downloads,
      }) => {
        return `<a class="gallery__item" href="${largeImageURL}"
        <div class="photo-card">
            <img class="gallery__image" src="${webformatURL}" alt="${tags}" loading="lazy" />
            <div class="info">
               <p class="info-item">
                  <b>Likes</b> ${likes}
               </p>
               <p class="info-item">
                  <b>Views</b> ${views}
               </p>
               <p class="info-item">
                  <b>Comments</b> ${comments}
               </p>
               <p class="info-item">
                  <b>Downloads</b> ${downloads}
               </p>
            </div>
         </div>
         </a>`;
      }
    )
    .join('');

  galleryItems.insertAdjacentHTML('beforeend', markup);

  let gallery = new simpleLightbox('.gallery__item');
  gallery.refresh();

  //Плавная прокрутка страницы после запроса и отрисовки каждой
  //следующей группы изображений:
  // const { height: cardHeight } = document
  //   .querySelector('.gallery')
  //   .firstElementChild.getBoundingClientRect();
  // window.scrollBy({
  //   top: cardHeight * 1,
  //   behavior: 'smooth',
  // });

  //Бесконечная загрузку изображений при прокрутке страницы:
  //   if (imagesArray.length === 40) {
  //     window.ias = new InfiniteAjaxScroll('.gallery', {
  //       item: '.gallery__item',
  //       next: getImg,
  //       pagination: false,
  //     });
  //   }
}

function cleanImages() {
  galleryItems.innerHTML = '';
  localStorage.removeItem(STORAGE_KEY);
  searchPage = 1;
}
