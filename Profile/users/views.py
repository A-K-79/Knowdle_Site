from django.shortcuts import render, redirect
from .models import Profile
from .forms import ProfileForm

def profile(request):
    profile = Profile.objects.first()

    return render(request, 'users/profile.html', {
        'profile': profile
    })

def edit_profile(request):
    profile = Profile.objects.first()

    if request.method == 'POST':
        form = ProfileForm(
            request.POST,
            request.FILES,
            instance=profile
        )

        if form.is_valid():
            form.save()
            return redirect('profile')

    else:
        form = ProfileForm(instance=profile)

    return render(request, 'users/edit_profile.html', {
        'form': form
    })